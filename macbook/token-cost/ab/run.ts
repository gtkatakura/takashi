// Small A/B of token-saving tools against plain Claude Code. Changes no user config: each variant gets
// its tool through per-run flags, env, a derived settings file, or files inside its own temporary directory.
//
//   AB_ARM=context-mode|headroom|graphify|rtk-caveman   tools under test (default context-mode)
//   AB_SUITE=fixtures|code|broad|all                         tasks (default: code for graphify, all for
//                                                       rtk-caveman, fixtures otherwise)
//   AB_MODEL=claude-haiku-5-5                           model
//   bun run.ts [reps=3] [concurrency=3]
//
// Every arm compares variants against the first one listed ("off", or "base" for rtk-caveman).
// Prerequisites live in ~/.cache/takashi-ab (see docs/token-cost/TEST-PLAN.md, step 8).
import { cpSync, mkdtempSync, mkdirSync, appendFileSync, existsSync, rmSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { build, type Task } from "./fixtures";
import { tasks as codeTasks } from "./code";
import { derive, has } from "./variants";
import { tasks as broadTasks } from "./broad";

const reps = Number(process.argv[2] ?? 3), concurrency = Number(process.argv[3] ?? 3);
const arm = process.env.AB_ARM ?? "context-mode";
const suite = process.env.AB_SUITE ?? ({ graphify: "code", "rtk-caveman": "all" }[arm] ?? "fixtures");
const model = process.env.AB_MODEL ?? "claude-haiku-5-5";
const root = join(homedir(), ".cache/takashi-ab");
const bin = join(root, "bin");
const need = (p: string) => { if (!existsSync(p)) throw new Error(`missing ${p}`); return p; };

// Telemetry off so A/B runs stay out of the Grafana baseline; no transcripts, so report.sh is unaffected too.
const baseEnv: Record<string, string> = { CLAUDE_CODE_ENABLE_TELEMETRY: "0" };

type Suited = Task & { base: string };
const suites: Suited[] = [];
if (suite === "fixtures" || suite === "all") {
  const base = join(root, "fixtures");
  rmSync(base, { recursive: true, force: true });
  suites.push(...build(base).map((t) => ({ ...t, base })));
}
if (suite === "code" || suite === "all" || suite === "broad") {
  const base = join(root, "code-base");
  if (!existsSync(base)) {
    // The pinned checkout without .git or graph, so runs without graphify see no graph at all.
    const src = need(join(root, "headroom"));
    cpSync(src, base, { recursive: true, filter: (p) => !/\/(\.git|graphify-out)(\/|$)/.test(p.slice(src.length)) });
  }
  suites.push(...(suite === "broad" ? broadTasks : codeTasks).map((t) => ({ ...t, base })));
}

type Variant = { args: string[]; env: Record<string, string>; prepare?: (cwd: string) => Promise<void> };
const plain = (): Variant => ({ args: [], env: {} });
const variants: Record<string, Variant> = {};
let stop = async () => {};

if (arm === "context-mode") {
  variants.off = plain();
  variants.on = { args: ["--plugin-dir", need(join(root, "context-mode/plugins/claude-code"))], env: {} };
} else if (arm === "headroom") {
  const port = 28787, url = `http://127.0.0.1:${port}`;
  const hrEnv = { ...process.env, HEADROOM_TELEMETRY: "off", HEADROOM_BEACON: "off", DO_NOT_TRACK: "1" };
  // --no-cache: its semantic cache would answer repeated prompts across reps and fake the savings.
  const proxy = Bun.spawn([need(join(bin, "headroom")), "proxy", "--port", String(port), "--no-cache"],
    { env: hrEnv, stdout: Bun.file(join(root, "proxy.log")), stderr: Bun.file(join(root, "proxy.log")) });
  stop = async () => { proxy.kill(); await proxy.exited; };
  for (let i = 0; ; i++) {
    try { await fetch(url + "/health"); break; } catch { if (i > 60) throw new Error("headroom proxy did not start"); await Bun.sleep(1000); }
  }
  variants.off = plain();
  variants.on = { env: { ANTHROPIC_BASE_URL: url }, args: ["--mcp-config", JSON.stringify({ mcpServers: { headroom: {
    command: join(bin, "headroom"), args: ["mcp", "serve", "--proxy-url", url],
    env: { HEADROOM_TELEMETRY: "off", HEADROOM_BEACON: "off", DO_NOT_TRACK: "1" } } } })] };
} else if (arm === "graphify") {
  const graph = need(join(root, "headroom/graphify-out/graph.json")).replace(/\/graph\.json$/, "");
  variants.off = plain();
  variants.on = { args: [], env: {}, prepare: async (cwd) => {
    cpSync(graph, join(cwd, "graphify-out"), { recursive: true });
    // Project-scoped: writes CLAUDE.md and .claude/settings.json hooks inside the run directory only.
    const p = Bun.spawn([join(bin, "graphify"), "claude", "install"], { cwd, stdout: "ignore", stderr: "ignore" });
    if ((await p.exited) !== 0) throw new Error("graphify claude install failed");
  } };
} else if (arm === "rtk-caveman") {
  variants.base = derive("base", false, false);
  variants.rtk = derive("rtk", true, false);
  variants.caveman = derive("caveman", false, true);
  variants.both = derive("both", true, true);
} else throw new Error(`unknown AB_ARM ${arm}`);
const names = Object.keys(variants);

mkdirSync(join(root, "results"), { recursive: true });
const out = join(root, "results", `${arm}-${model}-${new Date().toISOString().replace(/[:.]/g, "-")}.jsonl`);


type Job = { task: Suited; side: string; rep: number };
const jobs: Job[] = [];
for (let rep = 0; rep < reps; rep++)
  for (const [i, task] of suites.entries())
    // Rotate which variant goes first, so none always runs on a warmer cache.
    for (let k = 0; k < names.length; k++) jobs.push({ task, side: names[(k + rep + i) % names.length], rep });

async function run(j: Job) {
  const v = variants[j.side];
  const cwd = mkdtempSync(join(tmpdir(), `ab-${j.task.id}-`));
  cpSync(j.task.base, cwd, { recursive: true });
  await v.prepare?.(cwd);
  // Variants with their own settings file already carry baseEnv; the rest get it as flag settings.
  const settings = v.args.includes("--settings") ? [] : ["--settings", JSON.stringify({ env: { ...baseEnv, ...v.env } })];
  const args = ["-p", j.task.prompt, "--model", model, "--output-format", "stream-json", "--verbose", "--no-session-persistence",
    "--permission-mode", "bypassPermissions", "--max-budget-usd", "1", ...settings, ...v.args];
  const t0 = Date.now();
  const p = Bun.spawn(["claude", ...args], {
    cwd, stdin: "ignore", stdout: "pipe", stderr: "pipe",
    env: { ...process.env, ...v.env, PATH: `${bin}:${process.env.PATH}` },
  });
  const [stdout, stderr] = [await new Response(p.stdout).text(), await new Response(p.stderr).text()];
  await p.exited;
  rmSync(cwd, { recursive: true, force: true });
  // Claude Code keeps per-project folders (tool-results, memory) even with --no-session-persistence.
  rmSync(join(homedir(), ".claude/projects", cwd.replace(/[^A-Za-z0-9]/g, "-")), { recursive: true, force: true });

  const events = stdout.split("\n").flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } });
  const init = events.find((e) => e.type === "system" && e.subtype === "init");
  const r = events.findLast((e) => e.type === "result") ?? { is_error: true, result: (stdout + stderr).slice(-500) };
  // Which tools ran, so a tie can be told apart from "the tool was never used".
  const tools: Record<string, number> = {};
  for (const e of events) if (e.type === "assistant") for (const c of e.message?.content ?? []) if (c.type === "tool_use") {
    const name = c.name === "Bash" ? `Bash:${String(c.input?.command ?? "").trim().split(/\s+/)[0]}` : c.name;
    tools[name] = (tools[name] ?? 0) + 1;
  }
  const text = String(r.result ?? "");
  const answer = j.task.grade === "text" ? text : text.slice(text.lastIndexOf("ANSWER:"));
  const u = r.usage ?? {};
  const row = {
    arm, model, suite, task: j.task.id, side: j.side, rep: j.rep,
    ok: !r.is_error && text.includes("ANSWER:") && j.task.expect.every((e) => has(answer, e)) && !(j.task.reject ?? []).some((e) => has(answer, e)),
    cost: r.total_cost_usd ?? null, turns: r.num_turns ?? null, ms: Date.now() - t0,
    input: u.input_tokens ?? 0, cache_write: u.cache_creation_input_tokens ?? 0, cache_read: u.cache_read_input_tokens ?? 0,
    output: u.output_tokens ?? 0, tools, plugins: (init?.plugins ?? []).map((p: any) => p.name),
    answer: answer.slice(0, 300), error: r.is_error ? text.slice(0, 300) : undefined,
  };
  appendFileSync(out, JSON.stringify(row) + "\n");
  console.log(`${row.ok ? "pass" : "FAIL"} ${j.task.id.padEnd(12)} ${j.side.padEnd(7)} rep${j.rep} $${(row.cost ?? 0).toFixed(4)} turns=${row.turns} ${Object.entries(tools).map(([k, n]) => `${k}×${n}`).join(" ")}`);
  return row;
}

const queue = [...jobs];
const rows: Awaited<ReturnType<typeof run>>[] = [];
try {
  await Promise.all(Array.from({ length: concurrency }, async () => { for (let j; (j = queue.shift()); ) rows.push(await run(j)); }));
} finally { await stop(); }

const median = (a: number[]) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : NaN; };
console.log(`\n${arm} on ${model}, suite ${suite}. results: ${out}\n\ntask          variant pass  med$     med_in_tokens  med_out  med_turns`);
const ratios: Record<string, number[]> = Object.fromEntries(names.slice(1).map((n) => [n, []]));
for (const t of suites) {
  const med: Record<string, number> = {};
  for (const side of names) {
    const rs = rows.filter((r) => r.task === t.id && r.side === side);
    med[side] = median(rs.map((r) => r.cost ?? 0));
    const tokens = median(rs.map((r) => r.input + r.cache_write + r.cache_read));
    console.log(`${t.id.padEnd(13)} ${side.padEnd(7)} ${rs.filter((r) => r.ok).length}/${rs.length}   ${med[side].toFixed(4)}  ${String(tokens).padStart(13)}  ${String(median(rs.map((r) => r.output))).padStart(7)}  ${median(rs.map((r) => r.turns ?? 0))}`);
  }
  for (const n of names.slice(1)) ratios[n].push(med[n] / med[names[0]]);
}
console.log("");
for (const n of names) {
  const rs = rows.filter((r) => r.side === n);
  const cost = rs.reduce((s, r) => s + (r.cost ?? 0), 0), outTok = rs.reduce((s, r) => s + r.output, 0);
  const vs = n === names[0] ? "" : `  per-task median cost vs ${names[0]}: ${median(ratios[n]).toFixed(2)} (${ratios[n].map((x) => x.toFixed(2)).join(" ")})`;
  console.log(`${n.padEnd(7)} total $${cost.toFixed(4)}  output ${outTok}  pass ${rs.filter((r) => r.ok).length}/${rs.length}${vs}`);
}
