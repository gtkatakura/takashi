// Long multi-turn A/B: one Claude Code session per run, all turns sent as stream-json, billed cost read
// from the last result event (it is cumulative for the session). Changes no user config.
//
//   AB_EXP=long     base | rtk | context-mode | headroom, on the long suite (pytest, git, MCP JSON, logs)
//   AB_EXP=caveman  none | concise | caveman, on an explanation session about the headroom checkout
//   AB_MODEL        default claude-sonnet-5-5 (long) or claude-opus-5-5 (caveman)
//   bun session.ts [reps=3] [concurrency=3]
import { cpSync, mkdtempSync, mkdirSync, appendFileSync, existsSync, rmSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import type { Task } from "./fixtures";
import { buildLong } from "./long";
import { root, bin, need, derive, startHeadroom, median, has, type Variant } from "./variants";

const reps = Number(process.argv[2] ?? 3), concurrency = Number(process.argv[3] ?? 3);
const exp = process.env.AB_EXP ?? "long";
const model = process.env.AB_MODEL ?? (exp === "caveman" ? "claude-opus-5-5" : "claude-sonnet-5-5");

let turns: Task[], base: string, stop = async () => {};
const variants: Record<string, Variant> = {};
const end = "End your reply with a line `ANSWER: done`.";

if (exp === "long") {
  base = join(root, "long");
  rmSync(base, { recursive: true, force: true });
  mkdirSync(base, { recursive: true });
  turns = buildLong(base);
  const shop = { shop: { command: "bun", args: [join(import.meta.dir, "mcp.ts")] } };
  const withMcp = (v: Variant, extra = {}): Variant => ({ ...v, args: [...v.args, "--mcp-config", JSON.stringify({ mcpServers: { ...shop, ...extra } })] });
  variants.base = withMcp(derive("base", false, false));
  variants.rtk = withMcp(derive("rtk", true, false));
  const cm = derive("base", false, false);
  variants["context-mode"] = withMcp({ ...cm, args: [...cm.args, "--plugin-dir", need(join(root, "context-mode/plugins/claude-code"))] });
  const hr = await startHeadroom();
  stop = hr.stop;
  variants.headroom = withMcp({ ...derive("base", false, false), env: hr.env }, hr.mcp);
} else if (exp === "caveman") {
  base = need(join(root, "code-base"));
  // Prose-heavy session, Caveman's best case per its docs; "concise" is the cheap control it should beat.
  turns = [
    "Explain to a new contributor what this repository does and how it is organised. Read whatever you need first.",
    "Explain how the CacheAligner in headroom/transforms/cache_aligner.py works and why it exists.",
    "How does the ContentRouter decide which compressor to use for a piece of content?",
    "Walk me through what happens to a request from the moment the proxy receives it until it is forwarded upstream.",
    "What are the main trade-offs between the proxy's cache mode and token mode? Explain for someone deciding which to use.",
    "Explain how CCR (compress, cache, retrieve) works end to end.",
    "What are the biggest risks or weak spots in this design? Give your honest assessment.",
    "Write a short onboarding summary of everything we discussed, for a new team member.",
  ].map((p, i) => ({ id: `t${i + 1}`, prompt: `${p} ${end}`, expect: ["ANSWER:"], grade: "text" as const }));
  variants.none = derive("none", false, false);
  const plain = derive("none", false, false);
  variants.concise = { ...plain, args: [...plain.args, "--append-system-prompt", "Answer concisely."] };
  variants.caveman = derive("caveman", false, true);
} else throw new Error(`unknown AB_EXP ${exp}`);
const names = Object.keys(variants);

mkdirSync(join(root, "results"), { recursive: true });
const out = join(root, "results", `session-${exp}-${model}-${new Date().toISOString().replace(/[:.]/g, "-")}.jsonl`);

async function run(side: string, rep: number) {
  const v = variants[side];
  const cwd = mkdtempSync(join(tmpdir(), `ab-${exp}-`));
  cpSync(base, cwd, { recursive: true });
  const args = ["-p", "--input-format", "stream-json", "--output-format", "stream-json", "--verbose", "--model", model,
    "--no-session-persistence", "--permission-mode", "bypassPermissions", "--max-budget-usd", "8", ...v.args];
  const t0 = Date.now();
  const p = Bun.spawn(["claude", ...args], {
    cwd, stdin: "pipe", stdout: "pipe", stderr: "pipe",
    env: { ...process.env, ...v.env, PATH: `${bin}:${join(root, "pyenv/bin")}:${process.env.PATH}` },
  });
  // Send one turn at a time: messages written while a turn runs get merged into that turn.
  const sendTurn = (i: number) => {
    if (i < turns.length) p.stdin.write(JSON.stringify({ type: "user", message: { role: "user", content: turns[i].prompt } }) + "\n");
    else p.stdin.end();
  };
  sendTurn(0);
  const timer = setTimeout(() => p.kill(), 30 * 60_000);
  let stdout = "", pending = "", sent = 1;
  const errText = new Response(p.stderr).text();
  for await (const chunk of p.stdout) {
    const s = new TextDecoder().decode(chunk);
    stdout += s; pending += s;
    let i;
    while ((i = pending.indexOf("\n")) >= 0) {
      const line = pending.slice(0, i); pending = pending.slice(i + 1);
      try { if (JSON.parse(line).type === "result") sendTurn(sent++); } catch {}
    }
  }
  const stderr = await errText;
  await p.exited; clearTimeout(timer);
  rmSync(cwd, { recursive: true, force: true });
  rmSync(join(homedir(), ".claude/projects", cwd.replace(/[^A-Za-z0-9]/g, "-")), { recursive: true, force: true });

  const events = stdout.split("\n").flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } });
  const results = events.filter((e) => e.type === "result");
  const tools: Record<string, number> = {};
  for (const e of events) if (e.type === "assistant") for (const c of e.message?.content ?? []) if (c.type === "tool_use") {
    const name = c.name === "Bash" ? `Bash:${String(c.input?.command ?? "").trim().split(/\s+/)[0]}` : c.name;
    tools[name] = (tools[name] ?? 0) + 1;
  }
  const per = turns.map((t, i) => {
    const text = String(results[i]?.result ?? "");
    const ans = t.grade === "text" ? text : text.slice(text.lastIndexOf("ANSWER:"));
    return !!results[i] && !results[i].is_error && text.includes("ANSWER:") && t.expect.every((e) => has(ans, e));
  });
  const sum = (k: string) => results.reduce((s, r) => s + (r.usage?.[k] ?? 0), 0);
  const last = results.at(-1);
  const row = {
    exp, model, side, rep, turnsDone: results.length, pass: per.filter(Boolean).length, perTurn: per,
    cost: last?.total_cost_usd ?? null, apiTurns: results.reduce((s, r) => s + (r.num_turns ?? 0), 0), ms: Date.now() - t0,
    input: sum("input_tokens"), cache_write: sum("cache_creation_input_tokens"), cache_read: sum("cache_read_input_tokens"), output: sum("output_tokens"),
    tools, error: results.length < turns.length ? (stderr + stdout).slice(-400) : undefined,
  };
  appendFileSync(out, JSON.stringify(row) + "\n");
  console.log(`${side.padEnd(13)} rep${rep} pass ${row.pass}/${turns.length} $${(row.cost ?? 0).toFixed(3)} out=${row.output} cr=${row.cache_read} cw=${row.cache_write} ${Object.entries(tools).map(([k, n]) => `${k}×${n}`).join(" ")}`);
  return row;
}

const jobs: [string, number][] = [];
for (let rep = 0; rep < reps; rep++) for (let k = 0; k < names.length; k++) jobs.push([names[(k + rep) % names.length], rep]);
const rows: Awaited<ReturnType<typeof run>>[] = [];
try {
  await Promise.all(Array.from({ length: concurrency }, async () => { for (let j; (j = jobs.shift()); ) rows.push(await run(...j)); }));
} finally { await stop(); }

console.log(`\n${exp} on ${model}. results: ${out}\n\nvariant        med$     vs ${names[0]}  pass      med_out  med_cache_read  med_cache_write`);
const b = median(rows.filter((r) => r.side === names[0]).map((r) => r.cost ?? 0));
for (const n of names) {
  const rs = rows.filter((r) => r.side === n), m = median(rs.map((r) => r.cost ?? 0));
  console.log(`${n.padEnd(13)} ${m.toFixed(3).padStart(7)}  ${(m / b).toFixed(2).padStart(6)}   ${rs.reduce((s, r) => s + r.pass, 0)}/${rs.length * turns.length}  ${String(median(rs.map((r) => r.output))).padStart(8)}  ${String(median(rs.map((r) => r.cache_read))).padStart(14)}  ${String(median(rs.map((r) => r.cache_write))).padStart(15)}`);
}
