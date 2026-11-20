#!/usr/bin/env bun
// Proof kit: the mechanical part of a proof. It keeps the plan and the state of one run, runs one
// command string unchanged on the base and on the change, compares what came out and renders the
// report. Everything else (what to prove, how to start a stack, which tool dumps what) is the agent's.
// Run from inside the repository, on the checkout that holds the change.
//
//   proof.ts status                          where the run stands and what comes next (always run first)
//   proof.ts init --base <ref> --title <t> [--description <d> | --description-file <f>] [--new]
//   proof.ts claim <id> --text <promise> --method <m> --expect changed|same|holds --as text|json|image|number|exit
//                  [--surface <s>] [--where <w>] [--assert <words>] [--match <re>] [--gone <re>]
//                  [--exit-base <n>] [--exit-change <n>] [--want lower|higher] [--reason <why>]
//   proof.ts plan                            writes PLAN.md and prints it
//   proof.ts approve [--unattended]          locks the plan; nothing runs before this
//   proof.ts env base|change|both K=V ...    variables a side gets on every command (never a secret)
//   proof.ts each -- <cmd>                   setup on both sides (install, build), output shown
//   proof.ts pair <id> [--self] [--runs <n>] [--timeout <secs>] [compare flags] -- <cmd>
//   proof.ts compare <id> [--file <name>] [--ignore <re>]... [--ignore-key <key>]... [--threshold <pct>] [--metric time|stdout]
//   proof.ts attach <id> --note <words> [file...]   evidence made by hand: "observed", never "proven"
//   proof.ts block <id> --reason <why>
//   proof.ts note [--kind decision|dead-end|extra|limit] <words>
//   proof.ts proc add --name <n> --pid <pid> [--side <s>] [--port <p>] [--cmd <how it was started>]
//   proof.ts proc list | proc stop [<name>]
//   proof.ts report                          writes report.md and report.html
//   proof.ts close                           removes the base worktree; refuses while a process is alive
//   proof.ts prune [--yes]                   lists (deletes with --yes) closed runs of gone or merged branches
//
// A command run by `pair` or `each` gets: PROOF_SIDE (base|change), PROOF_OUT (where to write files that
// are evidence: screenshots, dumps, videos), PROOF_RUN, PROOF_BASE_DIR, PROOF_CHANGE_DIR.
// Scripts both sides share belong in $PROOF_RUN/scripts, outside both checkouts.
//
// Expectations: `changed` needs --assert plus a mechanical check (--match: in the change's output and not
// in the base's; --gone: the reverse; --exit-base/--exit-change; --want for numbers; an image only has to
// differ). `same` means identical after normalising. `holds` runs on the change only and passes on exit 0
// (or --exit-change), plus --match when given.
//
// Env: TAKASHI_STATE_DIR (default ${XDG_STATE_HOME:-~/.local/state}/takashi), PROOF_RUN (a run folder,
// instead of the latest run of this repository and branch).
import { appendFileSync, copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { homedir } from "node:os";
import { basename, join, relative } from "node:path";

type Side = "base" | "change";
type Expect = "changed" | "same" | "holds";
type Kind = "text" | "json" | "image" | "number" | "exit";
type Status = "planned" | "proven" | "contradicted" | "not-proven" | "observed" | "blocked";
type Run1 = { exit: number; ms: number; value?: number };
type SideResult = { sha: string; exit: number; ms: number; runs: Run1[]; files: string[] };
type Check = { name: string; ok: boolean; detail: string };
type Verdict = {
  status: Status; reason: string; at: string; differs?: boolean; checks: Check[]; self: "stable" | "unstable" | "none";
  normalization: { file?: string; ignore: string[]; ignoreKeys: string[]; threshold?: number; metric?: string };
  stats?: Record<string, { mean: number; sd: number; n: number }>; deltaPct?: number; pixels?: string; diff?: string;
};
type Declared = {
  text: string; method: string; surface?: string; where?: string; expect: Expect; as: Kind; assert?: string;
  match?: string; gone?: string; exitBase?: number; exitChange?: number; want?: "lower" | "higher";
};
type Claim = Declared & {
  id: string; status: Status; attempts: number; blocked?: string;
  evidence?: { cmd: string; at: string; runs: number; self: boolean; sides: Partial<Record<Side | "self", SideResult>> };
  manual?: { at: string; note: string; files: string[] }[]; verdict?: Verdict;
};
type Proc = { name: string; pid: number; started: string; side?: string; port?: string; cmd?: string; stopped?: string };
type Manifest = {
  version: 1; created: string; phase: "plan" | "approved" | "closed";
  task: { title: string; description: string };
  repo: { path: string; slug: string; branch: string };
  base: { ref: string; sha: string }; change: { sha: string; dirty: boolean };
  approval?: { at: string; by: "owner" | "unattended"; hash: string };
  env: Record<Side, Record<string, string>>;
  claims: Claim[];
  amendments: { at: string; claim: string; reason: string; before: Declared | null; after: Declared }[];
  notes: { at: string; kind: string; text: string }[];
  processes: Proc[];
};

const die = (msg: string): never => { console.error(`proof: ${msg}`); process.exit(1); };
const now = () => new Date().toISOString();
const DECLARED = ["text", "method", "surface", "where", "expect", "as", "assert", "match", "gone", "exitBase", "exitChange", "want"] as const;
const declared = (c: Claim): Declared => Object.fromEntries(DECLARED.filter((k) => c[k] !== undefined).map((k) => [k, c[k]])) as Declared;

// ---- arguments
const argv = process.argv.slice(2);
const dash = argv.indexOf("--");
const rest = dash >= 0 ? argv.slice(dash + 1) : [];
const [command, ...raw] = dash >= 0 ? argv.slice(0, dash) : argv;
const BOOL = new Set(["new", "self", "yes", "unattended"]);
const pos: string[] = [];
const flags: Record<string, string[]> = {};
for (let i = 0; i < raw.length; i++) {
  const a = raw[i];
  if (!a.startsWith("--")) { pos.push(a); continue; }
  const k = a.slice(2);
  const v = BOOL.has(k) ? "true" : raw[++i];
  if (v === undefined) die(`--${k} needs a value`);
  (flags[k] ??= []).push(v);
}
const flag = (k: string) => flags[k]?.at(-1);
const all = (k: string) => flags[k] ?? [];
const num = (k: string) => (flag(k) === undefined ? undefined : Number.isFinite(Number(flag(k))) ? Number(flag(k)) : die(`--${k} needs a number`));
const shq = (s: string) => (/^[\w@%+=:,./-]+$/.test(s) ? s : `'${s.replaceAll("'", `'\\''`)}'`);
const cmdline = () => (rest.length === 0 ? die("give the command after --") : rest.length === 1 ? rest[0] : rest.map(shq).join(" "));

// ---- git and paths
function git(cwd: string, ...args: string[]): { ok: boolean; out: string } {
  const p = Bun.spawnSync(["git", "-C", cwd, ...args], { stdin: "ignore", stdout: "pipe", stderr: "pipe" });
  return { ok: p.exitCode === 0, out: p.stdout.toString().trim() || p.stderr.toString().trim() };
}
const must = (cwd: string, ...args: string[]) => { const r = git(cwd, ...args); return r.ok ? r.out : die(`git ${args.join(" ")}: ${r.out}`); };
const slugify = (s: string) => s.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
const stateRoot = process.env.TAKASHI_STATE_DIR || join(process.env.XDG_STATE_HOME || join(homedir(), ".local/state"), "takashi");
const proofRoot = join(stateRoot, "proof");

function here() {
  const top = git(process.cwd(), "rev-parse", "--show-toplevel");
  if (!top.ok) die("run it from inside a git repository");
  const origin = git(top.out, "remote", "get-url", "origin");
  const parts = origin.ok ? origin.out.replace(/\.git$/, "").split(/[/:]/).filter(Boolean).slice(-2) : [basename(top.out)];
  const head = git(top.out, "symbolic-ref", "--short", "-q", "HEAD");
  const branch = head.ok && head.out ? head.out : `detached-${must(top.out, "rev-parse", "--short", "HEAD")}`;
  const slug = slugify(parts.join("--"));
  return { top: top.out, slug, branch, branchDir: join(proofRoot, slug, slugify(branch)) };
}
function runDir(): string | null {
  if (process.env.PROOF_RUN) return existsSync(join(process.env.PROOF_RUN, "manifest.json")) ? process.env.PROOF_RUN : die(`PROOF_RUN has no manifest.json: ${process.env.PROOF_RUN}`);
  const latest = join(here().branchDir, "latest");
  return existsSync(join(latest, "manifest.json")) ? realpathSync(latest) : null;
}
const load = (run: string): Manifest => JSON.parse(readFileSync(join(run, "manifest.json"), "utf8"));
function save(run: string, m: Manifest) {
  const tmp = join(run, `.manifest.${process.pid}.tmp`);
  writeFileSync(tmp, `${JSON.stringify(m, null, 2)}\n`);
  renameSync(tmp, join(run, "manifest.json"));
}
// Re-reads before writing: a subagent may have written to the same run meanwhile.
function update<T>(run: string, fn: (m: Manifest) => T): T { const m = load(run); const out = fn(m); save(run, m); return out; }
const journal = (run: string, entry: Record<string, unknown>) => appendFileSync(join(run, "journal.jsonl"), `${JSON.stringify({ at: now(), ...entry })}\n`);
function open(): { run: string; m: Manifest } {
  const run = runDir() ?? die("no run for this repository and branch: start with `init`");
  const m = load(run);
  if (m.phase === "closed") die(`the latest run is closed (${run}): start another with \`init\``);
  return { run, m };
}
const claimOf = (m: Manifest, id: string | undefined) => m.claims.find((c) => c.id === id) ?? die(`no claim "${id}": declare it with \`claim\``);
const sideDir = (run: string, m: Manifest, side: Side) => (side === "base" ? join(run, "worktree", "base") : m.repo.path);
const evidenceDir = (run: string, id: string, side: string) => join(run, "evidence", id, side);

// ---- running
const SECRET = /^(\s*[<>*]?\s*"?(?:authorization|cookie|set-cookie|x-csrf-token|x-api-key)"?\s*[:=]\s*).+$/gim;
const redact = (s: string) => s.replace(SECRET, "$1<redacted>");
async function exec(cmd: string, cwd: string, env: Record<string, string | undefined>, timeoutMs: number, show = false) {
  const t0 = performance.now();
  let timedOut = false;
  const p = Bun.spawn(["sh", "-c", cmd], { cwd, env, stdin: "ignore", stdout: show ? "inherit" : "pipe", stderr: show ? "inherit" : "pipe" });
  const timer = setTimeout(() => { timedOut = true; p.kill(); }, timeoutMs);
  const [out, err] = show ? ["", ""] : await Promise.all([new Response(p.stdout as ReadableStream).text(), new Response(p.stderr as ReadableStream).text()]);
  const code = await p.exited;
  clearTimeout(timer);
  return { exit: timedOut ? 124 : code, ms: Math.round(performance.now() - t0), out, err };
}
function ensureBase(run: string, m: Manifest) {
  const dir = sideDir(run, m, "base");
  if (existsSync(dir)) return;
  mkdirSync(join(run, "worktree"), { recursive: true });
  must(m.repo.path, "worktree", "add", "--detach", dir, m.base.sha);
  journal(run, { event: "worktree", dir, sha: m.base.sha });
}
const sideEnv = (run: string, m: Manifest, side: Side, out?: string) => ({
  ...process.env, ...m.env[side], PROOF_SIDE: side, PROOF_RUN: run, PROOF_BASE_DIR: sideDir(run, m, "base"), PROOF_CHANGE_DIR: m.repo.path, ...(out ? { PROOF_OUT: out } : {}),
});
const lastNumber = (s: string) => { const all = s.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi); return all ? Number(all.at(-1)) : undefined; };
function walk(dir: string, root = dir): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name), root) : [relative(root, join(dir, e.name))])).sort();
}

// ---- comparing
const stats = (xs: number[]) => {
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  return { mean, sd: Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, xs.length - 1)), n: xs.length };
};
function normalise(kind: Kind, text: string, ignore: string[], ignoreKeys: string[]): string {
  let out = text;
  if (kind === "json") {
    const strip = (v: unknown): unknown =>
      Array.isArray(v) ? v.map(strip)
      : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).filter(([k]) => !ignoreKeys.includes(k)).sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, x]) => [k, strip(x)]))
      : v;
    out = `${JSON.stringify(strip(JSON.parse(text)), null, 2)}\n`;
  }
  for (const re of ignore) out = out.replace(new RegExp(re, "gm"), "‹…›");
  return out;
}
function imageDiff(a: string, b: string, out: string): { differs: boolean; pixels: string } {
  if (readFileSync(a).equals(readFileSync(b))) return { differs: false, pixels: "identical files" };
  const p = Bun.spawnSync(["magick", "compare", "-metric", "AE", "-fuzz", "2%", a, b, out], { stdout: "pipe", stderr: "pipe" });
  if (p.exitCode === null || p.exitCode > 1) {
    const why = p.exitCode === null ? "ImageMagick is not installed" : p.stderr.toString().trim().split("\n")[0];
    return { differs: true, pixels: `files differ; no pixel count (${why})` };
  }
  const count = Math.round(Number(p.stderr.toString().trim().split(/\s/)[0]));
  const size = Bun.spawnSync(["magick", "identify", "-format", "%w %h", a], { stdout: "pipe" }).stdout.toString().trim().split(" ").map(Number);
  const total = size[0] * size[1];
  return { differs: count > 0, pixels: `${count} of ${total} pixels differ (${((100 * count) / total).toFixed(2)}%)` };
}
function compare(run: string, id: string) {
  const m = load(run);
  const c = claimOf(m, id);
  const ev = c.evidence ?? die(`claim "${id}" has no run yet: use \`pair\``);
  const prev = c.verdict?.normalization;
  const norm = {
    file: flag("file") ?? prev?.file, ignore: all("ignore").length ? all("ignore") : (prev?.ignore ?? []),
    ignoreKeys: all("ignore-key").length ? all("ignore-key") : (prev?.ignoreKeys ?? []), threshold: num("threshold") ?? prev?.threshold, metric: flag("metric") ?? prev?.metric,
  };
  const cmp = join(run, "evidence", id, "compared");
  rmSync(cmp, { recursive: true, force: true });
  mkdirSync(cmp, { recursive: true });
  const source = (side: string) => join(evidenceDir(run, id, side), norm.file ?? "stdout.txt");
  const rawText = (side: string) => (existsSync(source(side)) && c.as !== "image" ? readFileSync(source(side), "utf8") : "");
  const sides = c.expect === "holds" ? (["change"] as const) : (["base", "change"] as const);
  const v: Verdict = { status: "not-proven", reason: "", at: now(), checks: [], self: "none", normalization: norm };
  const finish = (status: Status, reason: string) => {
    v.status = status; v.reason = reason;
    update(run, (mm) => { const cc = claimOf(mm, id); cc.verdict = v; cc.status = status; });
    journal(run, { event: "compare", claim: id, status, reason, normalization: norm });
    console.log(`${id}: ${status.toUpperCase()} - ${reason}`);
    for (const k of v.checks) console.log(`  ${k.ok ? "ok  " : "FAIL"} ${k.name}: ${k.detail}`);
  };
  for (const s of sides) {
    if (!ev.sides[s]) return finish("not-proven", `no run on the ${s} side`);
    if (ev.sides[s]!.exit === 124) return finish("not-proven", `the command timed out on the ${s} side`);
    if (c.as !== "exit" && c.as !== "number" && !existsSync(source(s))) return finish("not-proven", `${norm.file} was not written on the ${s} side`);
  }
  const exit = (s: Side) => ev.sides[s]!.exit;
  const check = (name: string, ok: boolean, detail: string) => v.checks.push({ name, ok, detail });
  if (c.exitBase !== undefined && c.expect !== "holds") check("exit on base", exit("base") === c.exitBase, `expected ${c.exitBase}, got ${exit("base")}`);
  if (c.exitChange !== undefined || c.expect === "holds") check("exit on change", exit("change") === (c.exitChange ?? 0), `expected ${c.exitChange ?? 0}, got ${exit("change")}`);
  if (c.match) {
    const re = new RegExp(c.match, "m");
    const inChange = re.test(rawText("change")), inBase = c.expect === "holds" ? false : re.test(rawText("base"));
    check(`match /${c.match}/`, inChange && !inBase, c.expect === "holds" ? `in change: ${inChange}` : `in change: ${inChange}, in base: ${inBase} (wanted true, false)`);
  }
  if (c.gone) {
    const re = new RegExp(c.gone, "m");
    check(`gone /${c.gone}/`, re.test(rawText("base")) && !re.test(rawText("change")), `in base: ${re.test(rawText("base"))}, in change: ${re.test(rawText("change"))} (wanted true, false)`);
  }
  const failed = () => v.checks.filter((k) => !k.ok).map((k) => k.name).join(", ");
  if (c.expect === "holds") return finish(failed() ? "contradicted" : "proven", failed() ? `failed: ${failed()}` : "the command holds on the change");

  if (c.as === "number") {
    const metric = norm.metric ?? (sides.every((s) => ev.sides[s]!.runs.every((r) => r.value !== undefined)) ? "stdout" : "time");
    norm.metric = metric;
    const of = (s: Side) => stats(ev.sides[s]!.runs.map((r) => (metric === "time" ? r.ms : (r.value ?? die(`a run on ${s} printed no number`)))));
    const b = of("base"), ch = of("change"), threshold = norm.threshold ?? 5;
    norm.threshold = threshold;
    v.stats = { base: b, change: ch };
    v.deltaPct = b.mean === 0 ? (ch.mean === 0 ? 0 : Infinity) : (100 * (ch.mean - b.mean)) / Math.abs(b.mean);
    const moved = Math.abs(v.deltaPct) > threshold, beyondNoise = Math.abs(ch.mean - b.mean) > b.sd + ch.sd;
    v.differs = moved;
    const line = `${metric}: base ${b.mean.toFixed(2)} ± ${b.sd.toFixed(2)}, change ${ch.mean.toFixed(2)} ± ${ch.sd.toFixed(2)} (${v.deltaPct >= 0 ? "+" : ""}${v.deltaPct.toFixed(1)}%, n=${b.n}, threshold ${threshold}%)`;
    if (c.expect === "same") return finish(moved ? "contradicted" : "proven", line);
    if (!moved) return finish("contradicted", `no change beyond the threshold. ${line}`);
    const right = c.want === "lower" ? v.deltaPct < 0 : v.deltaPct > 0;
    check(`want ${c.want}`, right, `${v.deltaPct.toFixed(1)}%`);
    check("beyond noise", beyondNoise, `difference of means against the sum of both deviations (${(b.sd + ch.sd).toFixed(2)})`);
    return finish(failed() ? "not-proven" : "proven", failed() ? `moved, but failed: ${failed()}. ${line}` : line);
  }

  let differs: (a: string, b: string, tag: string) => boolean;
  if (c.as === "exit") differs = () => exit("base") !== exit("change");
  else if (c.as === "image") {
    differs = (a, b, tag) => { const r = imageDiff(source(a), source(b), join(cmp, `${tag}.png`)); if (tag === "diff") { v.pixels = r.pixels; if (r.differs && existsSync(join(cmp, "diff.png"))) v.diff = "compared/diff.png"; } return r.differs; };
  } else {
    differs = (a, b, tag) => {
      const [fa, fb] = [join(cmp, `${a}.txt`), join(cmp, `${b}.txt`)];
      for (const [side, file] of [[a, fa], [b, fb]]) {
        try { writeFileSync(file, normalise(c.as, readFileSync(source(side), "utf8"), norm.ignore, norm.ignoreKeys)); }
        catch (e) { throw new Error(`the ${side} output is not readable as ${c.as}: ${(e as Error).message}`); }
      }
      const d = Bun.spawnSync(["git", "diff", "--no-index", "--no-color", "-U3", `${a}.txt`, `${b}.txt`], { cwd: cmp, stdout: "pipe" });
      if (d.exitCode !== 0 && tag === "diff") { writeFileSync(join(cmp, "diff.patch"), d.stdout); v.diff = "compared/diff.patch"; }
      return d.exitCode !== 0;
    };
  }
  try {
    if (ev.self && c.as !== "exit") v.self = differs("base", "self", "self") ? "unstable" : "stable";
    v.differs = differs("base", "change", "diff");
  } catch (e) { return finish("not-proven", (e as Error).message); }
  const unstable = "the base differs from itself between two runs: normalise what moves (--ignore, --ignore-key) or fix the script";
  if (c.expect === "same") {
    if (c.as !== "exit") check("same exit", exit("base") === exit("change"), `base ${exit("base")}, change ${exit("change")}`);
    if (v.self === "unstable") return finish("not-proven", unstable);
    if (v.differs) return finish("contradicted", `expected the same, and it changed${v.pixels ? `: ${v.pixels}` : ""}`);
    return finish(failed() ? "contradicted" : "proven", failed() ? `failed: ${failed()}` : "identical on both sides");
  }
  if (!v.differs) return finish("contradicted", "expected a change, and both sides are identical");
  if (v.self === "unstable" && v.checks.length === 0) return finish("not-proven", unstable);
  finish(failed() ? "not-proven" : "proven", failed() ? `it changed, but not as asserted: ${failed()}` : `it changed as asserted${v.pixels ? `: ${v.pixels}` : ""}`);
}

// ---- processes
function startedAt(pid: number): string | null {
  const p = Bun.spawnSync(["ps", "-o", "lstart=", "-p", String(pid)], { stdout: "pipe", stderr: "pipe" });
  return p.exitCode === 0 && p.stdout.toString().trim() ? p.stdout.toString().trim() : null;
}
// Alive only when the PID still belongs to the process that was registered: a PID can be reused.
const alive = (p: Proc) => !p.stopped && startedAt(p.pid) === p.started;

// ---- rendering
const WORD: Record<Status, string> = { planned: "Not run", proven: "Proven", contradicted: "Contradicted", "not-proven": "Not proven", observed: "Observed by the agent, not scripted", blocked: "Blocked" };
const esc = (s: string) => s.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]!);
const cell = (s: string | undefined) => (s ?? "").replaceAll("|", "\\|").replace(/\s*\n\s*/g, " ");
const expectLine = (c: Claim) => [
  c.expect === "holds" ? "holds on the change" : c.expect, c.assert && `"${c.assert}"`, c.match && `match /${c.match}/`, c.gone && `gone /${c.gone}/`,
  c.exitBase !== undefined && `exit ${c.exitBase} on base`, c.exitChange !== undefined && `exit ${c.exitChange} on change`, c.want && `want ${c.want}`,
].filter(Boolean).join("; ");
const approvalLine = (m: Manifest) => !m.approval ? "plan not approved yet" : m.approval.by === "owner" ? `plan approved by the owner at ${m.approval.at}` : `plan NOT approved by a person (unattended run), locked at ${m.approval.at}`;
const header = (m: Manifest) => `\`${m.repo.slug}\` · branch \`${m.repo.branch}\` · base \`${m.base.ref}\` @ \`${m.base.sha.slice(0, 9)}\` → change \`${m.change.sha.slice(0, 9)}\`${m.change.dirty ? " plus uncommitted work" : ""} · ${approvalLine(m)}`;

function planMd(m: Manifest): string {
  const rows = m.claims.map((c) => `| \`${c.id}\` | ${cell(c.text)} | ${cell(c.surface)} | ${cell(c.method)} (${c.as}) | ${cell(c.where)} | ${cell(expectLine(c))} | ${WORD[c.status]} |`);
  return [`# Proof plan: ${m.task.title}`, "", header(m), "", "## The task as received", "", m.task.description || "_No description._", "", "## Promises", "",
    "| Id | Promise | Surface | Method | Where it is observed | Expectation | State |", "| --- | --- | --- | --- | --- | --- | --- |", ...rows, "",
    ...(m.amendments.length ? ["## Amendments after approval", "", ...m.amendments.map((a) => `- ${a.at} \`${a.claim}\`: ${a.reason}`), ""] : [])].join("\n");
}
function evidenceLines(run: string, c: Claim): string[] {
  const out: string[] = [];
  const ev = c.evidence, v = c.verdict;
  out.push(`- **Method:** ${c.method} (${c.as})${c.surface ? `, surface: ${c.surface}` : ""}`, `- **Expectation, declared before the run:** ${expectLine(c)}`);
  if (ev) {
    out.push(`- **Command, the same string on each side:** \`${ev.cmd.replaceAll("`", "'")}\``);
    for (const [s, r] of Object.entries(ev.sides)) out.push(`  - ${s}: exit ${r.exit}, ${r.ms} ms${r.runs.length > 1 ? ` (last of ${r.runs.length} runs)` : ""}, commit \`${r.sha.slice(0, 9)}\`${r.files.length ? `, files: ${r.files.map((f) => `\`evidence/${c.id}/${s}/${f}\``).join(", ")}` : ""}`);
    out.push(`- **Times the pair was run:** ${c.attempts}`);
  }
  if (v) {
    out.push(`- **Result:** ${WORD[v.status]}: ${v.reason}`);
    const n = v.normalization;
    const norm = [n.file && `compared file \`${n.file}\``, n.ignore.length && `ignored ${n.ignore.map((r) => `/${r}/`).join(", ")}`, n.ignoreKeys.length && `ignored keys ${n.ignoreKeys.join(", ")}`].filter(Boolean).join("; ");
    if (norm) out.push(`- **Normalisation:** ${norm}`);
    for (const k of v.checks) out.push(`- **Check** ${k.name}: ${k.ok ? "ok" : "FAILED"} (${k.detail})`);
    if (c.as !== "exit" && c.as !== "number" && c.expect !== "holds") out.push(`- **Self check (base against base):** ${v.self === "none" ? "not run, so moving output was not ruled out" : v.self}`);
    if (v.diff) out.push(`- **Difference:** \`evidence/${c.id}/${v.diff}\``);
  }
  for (const a of c.manual ?? []) out.push(`- **Observed by hand** (${a.at}): ${a.note}${a.files.length ? ` Files: ${a.files.map((f) => `\`evidence/${c.id}/manual/${f}\``).join(", ")}` : ""}`);
  if (c.blocked) out.push(`- **Blocked:** ${c.blocked}`);
  const patch = v?.diff?.endsWith(".patch") ? join(run, "evidence", c.id, v.diff) : null;
  if (patch && existsSync(patch)) { const lines = readFileSync(patch, "utf8").split("\n"); out.push("", "```diff", ...lines.slice(0, 60), ...(lines.length > 60 ? [`… ${lines.length - 60} more lines in the file`] : []), "```"); }
  return out;
}
function reportMd(run: string, m: Manifest): string {
  const notes = (kind: string) => m.notes.filter((n) => n.kind === kind).map((n) => `- ${n.text}`);
  const weak = m.claims.filter((c) => c.status !== "proven");
  const envOf = (s: Side) => Object.entries(m.env[s]).map(([k, v]) => `${k}=${shq(v)}`).join(" ");
  const repeat = m.claims.filter((c) => c.evidence).flatMap((c) => [`- \`${c.id}\`: \`${c.evidence!.cmd.replaceAll("`", "'")}\`${c.expect === "holds" ? " on the change" : " on each side"}, then look for: ${c.assert ?? (c.expect === "same" ? "the same output on both" : expectLine(c))}`]);
  return [`# Proof: ${m.task.title}`, "", header(m), "",
    "## What was promised", "", m.task.description || "_No description._", "",
    "## Verdict", "", "| Promise | Verdict | Why | Evidence |", "| --- | --- | --- | --- |",
    ...m.claims.map((c) => `| ${cell(c.text)} | **${WORD[c.status]}** | ${cell(c.verdict?.reason ?? c.blocked ?? (c.manual ? c.manual.at(-1)!.note : "no evidence"))} | \`evidence/${c.id}/\` |`), "",
    "## Repeat it yourself", "", `Base is a worktree of \`${m.base.sha.slice(0, 9)}\`, change is the checkout. Shared scripts are in \`scripts/\` of this folder.`,
    ...(envOf("base") || envOf("change") ? [`Variables per side: base \`${envOf("base") || "none"}\`, change \`${envOf("change") || "none"}\`.`] : []), "", ...(repeat.length ? repeat : ["- Nothing was scripted."]), "",
    ...(m.processes.length ? ["Processes this run started:", "", ...m.processes.map((p) => `- ${p.name}${p.side ? ` (${p.side})` : ""}${p.port ? `, port ${p.port}` : ""}${p.cmd ? `: \`${p.cmd.replaceAll("`", "'")}\`` : ""}`), ""] : []),
    "## The diff does more than the task says", "", ...(notes("extra").length ? notes("extra") : ["- Nothing recorded."]), "",
    "## Not proven and limits", "", ...(weak.length || notes("limit").length ? [...weak.map((c) => `- \`${c.id}\` ${WORD[c.status]}: ${c.verdict?.reason ?? c.blocked ?? (c.manual ? "seen by hand only" : "no evidence")}`), ...notes("limit")] : ["- Every promise is proven."]), "",
    ...(m.amendments.length ? ["## Plan amendments after approval", "", ...m.amendments.map((a) => `- ${a.at} \`${a.claim}\`: ${a.reason}`), ""] : []),
    "## Technical appendix", "", ...m.claims.flatMap((c) => [`### \`${c.id}\` ${c.text}`, "", ...evidenceLines(run, c), ""])].join("\n");
}
const MEDIA = /\.(png|jpe?g|webp|gif|webm|mp4)$/i;
function mdToHtml(md: string): string {
  const inline = (s: string) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/(^|\W)_([^_]+)_(?=\W|$)/g, "$1<em>$2</em>");
  const out: string[] = [];
  let list = false, table = false, code = false;
  const end = () => { if (list) out.push("</ul>"); if (table) out.push("</table></div>"); list = table = false; };
  for (const line of md.split("\n")) {
    if (line.startsWith("```")) { end(); out.push(code ? "</pre>" : "<pre>"); code = !code; continue; }
    if (code) { out.push(esc(line)); continue; }
    const h = line.match(/^(#{1,3}) (.*)$/);
    if (h) { end(); out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); continue; }
    if (line.startsWith("|")) {
      if (/^\|[\s|-]+\|$/.test(line)) continue;
      const cells = line.slice(1, -1).split(/(?<!\\)\|/).map((x) => inline(x.trim().replaceAll("\\|", "|")));
      if (!table) { end(); out.push('<div class="scroll"><table>'); table = true; out.push(`<tr>${cells.map((x) => `<th>${x}</th>`).join("")}</tr>`); }
      else out.push(`<tr>${cells.map((x) => `<td>${x}</td>`).join("")}</tr>`);
      continue;
    }
    const li = line.match(/^(\s*)- (.*)$/);
    if (li) { if (!list) { end(); out.push("<ul>"); list = true; } out.push(`<li${li[1] ? ' class="sub"' : ""}>${inline(li[2])}</li>`); continue; }
    end();
    if (line.trim()) out.push(`<p>${inline(line)}</p>`);
  }
  end();
  return out.join("\n");
}
function reportHtml(run: string, m: Manifest, md: string): string {
  const media = m.claims.flatMap((c) => {
    const sides = ["base", "change", "manual"].map((s) => ({ s, files: existsSync(evidenceDir(run, c.id, s)) ? walk(evidenceDir(run, c.id, s)).filter((f) => MEDIA.test(f)) : [] }));
    const names = [...new Set(sides.flatMap((x) => x.files))];
    if (!names.length) return [];
    const show = (s: string, f: string) => { const src = esc(`evidence/${c.id}/${s}/${f}`); return /\.(webm|mp4)$/i.test(f) ? `<video controls src="${src}"></video>` : `<a href="${src}"><img src="${src}" alt="${esc(`${s}: ${f}`)}"></a>`; };
    const figures = names.map((f) => `<h4>${esc(f)}</h4><div class="pair">${sides.filter((x) => x.files.includes(f)).map((x) => `<figure>${show(x.s, f)}<figcaption>${x.s}</figcaption></figure>`).join("")}${c.verdict?.diff?.endsWith(".png") && f === (c.verdict.normalization.file ?? "") ? `<figure><img src="${esc(`evidence/${c.id}/${c.verdict.diff}`)}" alt="difference"><figcaption>difference</figcaption></figure>` : ""}</div>`);
    return [`<h3><code>${esc(c.id)}</code> ${esc(c.text)}</h3>`, ...figures];
  });
  const css = `:root{--bg:#f7f7f9;--surface:#fff;--ink:#1b1c22;--muted:#5d6070;--line:#dfe0e7;--code:#e7edfb}
@media (prefers-color-scheme:dark){:root{color-scheme:dark;--bg:#15161b;--surface:#1d1f26;--ink:#eceef4;--muted:#a2a6b6;--line:#30333e;--code:#232c45}}
*{box-sizing:border-box}body{margin:0;padding:32px 16px 72px;background:var(--bg);color:var(--ink);font:16px/1.6 system-ui,sans-serif}
main{max-width:920px;margin:0 auto}h1{font-size:30px;line-height:1.2}h2{font-size:21px;margin-top:40px}h3{font-size:17px;margin-top:28px}h4{font-size:14px;color:var(--muted);margin:16px 0 8px}
code{font:0.88em ui-monospace,monospace;background:var(--code);padding:0 4px;border-radius:4px;overflow-wrap:anywhere}
pre{overflow-x:auto;background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:12px 16px;font:13px/1.5 ui-monospace,monospace}
.scroll{overflow-x:auto;border:1px solid var(--line);border-radius:8px;background:var(--surface)}table{border-collapse:collapse;width:100%;font-size:14.5px}
th,td{text-align:left;vertical-align:top;padding:10px 14px;border-bottom:1px solid var(--line)}th{color:var(--muted);font-size:13px}tr:last-child td{border-bottom:0}
li.sub{margin-left:20px}.pair{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}figure{margin:0}figcaption{font-size:13px;color:var(--muted)}
img,video{max-width:100%;border:1px solid var(--line);border-radius:6px;display:block}`;
  return `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Proof: ${esc(m.task.title)}</title><style>${css}</style></head>\n<body><main>\n${mdToHtml(md)}\n${media.length ? `<h2>Screens and recordings</h2>\n${media.join("\n")}` : ""}\n</main></body></html>\n`;
}

// ---- commands
function nextStep(m: Manifest): string {
  if (m.phase === "closed") return "closed: `init` starts another run";
  if (!m.claims.length) return "declare each promise with `claim`";
  if (m.phase === "plan") return "show `plan` to the owner, then `approve` (or `approve --unattended` when nobody can answer)";
  const todo = m.claims.filter((c) => c.status === "planned");
  if (todo.length) return `run \`pair\` for: ${todo.map((c) => c.id).join(", ")}`;
  if (m.processes.some(alive)) return "write the `report`, then `proc stop` and `close`";
  return "write the `report`, then `close`";
}
function printStatus(run: string, m: Manifest) {
  console.log(`run    ${run}\ntask   ${m.task.title}\nrepo   ${m.repo.slug} (${m.repo.branch}), base ${m.base.ref} @ ${m.base.sha.slice(0, 9)}, change ${m.change.sha.slice(0, 9)}${m.change.dirty ? " +uncommitted" : ""}`);
  console.log(`phase  ${m.phase}; ${approvalLine(m)}`);
  if (existsSync(sideDir(run, m, "base"))) console.log(`sides  base ${sideDir(run, m, "base")}\n       change ${m.repo.path}`);
  for (const c of m.claims) console.log(`  [${c.status.padEnd(12)}] ${c.id}: ${c.text}${c.verdict ? ` (${c.verdict.reason})` : ""}`);
  for (const p of m.processes) console.log(`  proc ${p.name} pid ${p.pid}${p.port ? ` port ${p.port}` : ""}: ${alive(p) ? "ALIVE" : "not running"}`);
  const dead = m.notes.filter((n) => n.kind === "dead-end" || n.kind === "decision").slice(-5);
  for (const n of dead) console.log(`  ${n.kind}: ${n.text}`);
  console.log(`next   ${nextStep(m)}`);
}

const commands: Record<string, () => void | Promise<void>> = {
  status() {
    const run = runDir();
    if (!run) return console.log(`no run for ${here().slug} (${here().branch}) under ${proofRoot}\nnext   \`init --base <ref> --title <task title> --description <task description>\``);
    printStatus(run, load(run));
  },
  init() {
    const h = here();
    const existing = runDir();
    if (existing && load(existing).phase !== "closed" && !flag("new")) die(`a run is open: ${existing}\nresume it (see \`status\`), or pass --new to start another`);
    const ref = flag("base") ?? die("--base <ref> is required");
    const title = flag("title") ?? die("--title is required: the task title as the owner wrote it");
    const description = flag("description-file") ? readFileSync(flag("description-file")!, "utf8").trim() : (flag("description") ?? "");
    const baseSha = must(h.top, "rev-parse", "--verify", `${ref}^{commit}`);
    const sha = must(h.top, "rev-parse", "HEAD");
    const stamp = now().slice(0, 16).replace(/:/g, "");
    let run = join(h.branchDir, `${stamp}-${sha.slice(0, 7)}`);
    for (let i = 2; existsSync(run); i++) run = join(h.branchDir, `${stamp}-${sha.slice(0, 7)}-${i}`);
    mkdirSync(join(run, "scripts"), { recursive: true });
    save(run, {
      version: 1, created: now(), phase: "plan", task: { title, description }, repo: { path: h.top, slug: h.slug, branch: h.branch },
      base: { ref, sha: baseSha }, change: { sha, dirty: must(h.top, "status", "--porcelain") !== "" }, env: { base: {}, change: {} }, claims: [], amendments: [], notes: [], processes: [],
    });
    rmSync(join(h.branchDir, "latest"), { force: true });
    symlinkSync(basename(run), join(h.branchDir, "latest"));
    journal(run, { event: "init", base: baseSha, change: sha });
    console.log(`run    ${run}\nnext   declare each promise with \`claim\``);
  },
  claim() {
    const { run } = open();
    const id = pos[0] ?? die("claim needs an id");
    if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) die("the id is lowercase letters, digits and dashes");
    update(run, (m) => {
      const old = m.claims.find((c) => c.id === id);
      const before = old ? declared(old) : null;
      const c: Claim = old ?? ({ id, status: "planned", attempts: 0 } as Claim);
      const set = { text: flag("text"), method: flag("method"), surface: flag("surface"), where: flag("where"), expect: flag("expect"), as: flag("as"), assert: flag("assert"), match: flag("match"), gone: flag("gone"), exitBase: num("exit-base"), exitChange: num("exit-change"), want: flag("want") };
      for (const [k, v] of Object.entries(set)) if (v !== undefined) (c as Record<string, unknown>)[k] = v;
      if (c.expect === "holds") c.as ??= "exit";
      for (const k of ["text", "method", "expect", "as"] as const) if (!c[k]) die(`--${k} is required`);
      if (!["changed", "same", "holds"].includes(c.expect)) die("--expect is changed, same or holds");
      if (!["text", "json", "image", "number", "exit"].includes(c.as)) die("--as is text, json, image, number or exit");
      if (c.want && !["lower", "higher"].includes(c.want)) die("--want is lower or higher");
      for (const k of ["match", "gone"] as const) if (c[k]) try { new RegExp(c[k]!); } catch { die(`--${k} is not a valid regular expression`); }
      if (c.expect === "changed") {
        if (!c.assert) die('a "changed" promise needs --assert: say in words what must be different, or any difference would pass');
        const mechanical = c.as === "image" || (c.as === "number" ? !!c.want : c.as === "exit" ? c.exitBase !== undefined && c.exitChange !== undefined : !!(c.match || c.gone || c.exitBase !== undefined || c.exitChange !== undefined));
        if (!mechanical) die(c.as === "number" ? "a changed number needs --want lower|higher" : c.as === "exit" ? "a changed exit needs --exit-base and --exit-change" : "a changed text or json needs a check: --match, --gone, --exit-base or --exit-change");
      }
      if (c.expect === "holds" && (c.gone || c.exitBase !== undefined)) die("a promise that holds runs on the change only: --gone and --exit-base do not apply");
      const after = declared(c);
      if (m.phase === "approved" && JSON.stringify(before) !== JSON.stringify(after)) {
        const reason = flag("reason") ?? die("the plan is approved: changing a promise needs --reason, and the report will show it");
        m.amendments.push({ at: now(), claim: id, reason, before, after });
        Object.assign(c, { status: "planned", verdict: undefined, evidence: undefined });
        journal(run, { event: "amend", claim: id, reason });
      }
      if (!old) m.claims.push(c);
      console.log(`${old ? "updated" : "declared"} ${id}: ${expectLine(c)}`);
    });
  },
  plan() {
    const run = runDir() ?? die("no run: start with `init`");
    const md = planMd(load(run));
    writeFileSync(join(run, "PLAN.md"), `${md}\n`);
    console.log(`${md}\n\n(written to ${join(run, "PLAN.md")})`);
  },
  approve() {
    const { run } = open();
    update(run, (m) => {
      if (!m.claims.length) die("nothing to approve: declare the promises first");
      if (m.phase === "approved") die("the plan is already approved");
      m.phase = "approved";
      m.approval = { at: now(), by: flag("unattended") ? "unattended" : "owner", hash: createHash("sha256").update(JSON.stringify(m.claims.map((c) => [c.id, declared(c)]))).digest("hex").slice(0, 16) };
      journal(run, { event: "approve", ...m.approval });
      console.log(`${approvalLine(m)}\nnext   ${nextStep(m)}`);
    });
  },
  env() {
    const { run } = open();
    const [side, ...pairs] = pos;
    if (!["base", "change", "both"].includes(side) || !pairs.length || pairs.some((p) => !/^[A-Za-z_]\w*=/.test(p))) die("usage: env base|change|both NAME=value ...");
    update(run, (m) => { for (const s of side === "both" ? (["base", "change"] as const) : [side as Side]) for (const p of pairs) m.env[s][p.slice(0, p.indexOf("="))] = p.slice(p.indexOf("=") + 1); });
    journal(run, { event: "env", side, names: pairs.map((p) => p.slice(0, p.indexOf("="))) });
  },
  async each() {
    const { run, m } = open();
    if (m.phase !== "approved") die("the plan is not approved: nothing runs before `approve`");
    const cmd = cmdline();
    ensureBase(run, m);
    let failed = false;
    for (const side of ["base", "change"] as const) {
      console.log(`--- ${side}: ${cmd}`);
      const r = await exec(cmd, sideDir(run, m, side), sideEnv(run, m, side), (num("timeout") ?? 1800) * 1000, true);
      journal(run, { event: "each", side, cmd, exit: r.exit, ms: r.ms });
      console.log(`--- ${side}: exit ${r.exit} in ${r.ms} ms`);
      failed ||= r.exit !== 0;
    }
    if (failed) process.exit(1);
  },
  async pair() {
    const { run, m } = open();
    if (m.phase !== "approved") die("the plan is not approved: nothing runs before `approve`");
    const id = pos[0];
    const c = claimOf(m, id);
    const cmd = cmdline();
    const runs = num("runs") ?? 1, timeout = (num("timeout") ?? 600) * 1000, self = !!flag("self");
    if (c.expect !== "holds") ensureBase(run, m);
    const plan: { tag: Side | "self"; side: Side }[] = c.expect === "holds" ? [{ tag: "change", side: "change" }] : [{ tag: "base", side: "base" }, ...(self ? [{ tag: "self" as const, side: "base" as const }] : []), { tag: "change", side: "change" }];
    const sides: Partial<Record<Side | "self", SideResult>> = {};
    for (const { tag, side } of plan) {
      const out = evidenceDir(run, id, tag), cwd = sideDir(run, m, side);
      rmSync(out, { recursive: true, force: true });
      mkdirSync(out, { recursive: true });
      const results: Run1[] = [];
      let last = { exit: 0, ms: 0, out: "", err: "" };
      for (let i = 0; i < runs; i++) { last = await exec(cmd, cwd, sideEnv(run, m, side, out), timeout); results.push({ exit: last.exit, ms: last.ms, value: lastNumber(last.out) }); }
      const files = walk(out);
      writeFileSync(join(out, "stdout.txt"), redact(last.out));
      writeFileSync(join(out, "stderr.txt"), redact(last.err));
      sides[tag] = { sha: side === "base" ? m.base.sha : must(m.repo.path, "rev-parse", "HEAD"), exit: last.exit, ms: last.ms, runs: results, files };
      journal(run, { event: "pair", claim: id, side: tag, cmd, exit: last.exit, ms: last.ms, runs });
      console.log(`${id} ${tag}: exit ${last.exit} in ${last.ms} ms${files.length ? `, files: ${files.join(", ")}` : ""}`);
    }
    update(run, (mm) => { const cc = claimOf(mm, id); cc.attempts += 1; cc.evidence = { cmd, at: now(), runs, self, sides }; });
    compare(run, id);
  },
  compare() { compare(open().run, pos[0] ?? die("compare needs a claim id")); },
  attach() {
    const { run } = open();
    const [id, ...files] = pos;
    const note = flag("note") ?? die("--note is required: what was seen, and how");
    const dir = evidenceDir(run, id, "manual");
    update(run, (m) => {
      const c = claimOf(m, id);
      mkdirSync(dir, { recursive: true });
      for (const f of files) { if (!existsSync(f) || !statSync(f).isFile()) die(`not a file: ${f}`); copyFileSync(f, join(dir, basename(f))); }
      (c.manual ??= []).push({ at: now(), note, files: files.map((f) => basename(f)) });
      if (c.status === "planned" || c.status === "not-proven" || c.status === "blocked") c.status = "observed";
      console.log(`${id}: ${c.status} (evidence made by hand never counts as proven)`);
    });
    journal(run, { event: "attach", claim: id, note, files: files.map((f) => basename(f)) });
  },
  block() {
    const { run } = open();
    const reason = flag("reason") ?? die("--reason is required");
    update(run, (m) => { const c = claimOf(m, pos[0]); c.status = "blocked"; c.blocked = reason; });
    journal(run, { event: "block", claim: pos[0], reason });
  },
  note() {
    const { run } = open();
    const kind = flag("kind") ?? "decision";
    if (!["decision", "dead-end", "extra", "limit"].includes(kind)) die("--kind is decision, dead-end, extra or limit");
    const text = pos.join(" ") || die("note needs the words");
    update(run, (m) => void m.notes.push({ at: now(), kind, text }));
    journal(run, { event: "note", kind, text });
  },
  async proc() {
    const { run, m } = open();
    const [sub, name] = pos;
    if (sub === "add") {
      const pid = num("pid") ?? die("--pid is required");
      const started = startedAt(pid) ?? die(`no process with pid ${pid}`);
      const p: Proc = { name: flag("name") ?? die("--name is required"), pid, started, side: flag("side"), port: flag("port"), cmd: flag("cmd") };
      update(run, (mm) => void mm.processes.push(p));
      journal(run, { event: "proc-add", ...p });
    } else if (sub === "stop") {
      for (const p of m.processes.filter((x) => !x.stopped && (!name || x.name === name))) {
        if (alive(p)) {
          process.kill(p.pid, "SIGTERM");
          for (let i = 0; i < 50 && alive(p); i++) await Bun.sleep(100);
          if (alive(p)) { console.log(`${p.name} pid ${p.pid}: still alive after SIGTERM, left as is`); continue; }
          console.log(`${p.name} pid ${p.pid}: stopped`);
        } else console.log(`${p.name} pid ${p.pid}: already gone`);
        update(run, (mm) => { mm.processes.find((x) => x.pid === p.pid && x.started === p.started)!.stopped = now(); });
        journal(run, { event: "proc-stop", name: p.name, pid: p.pid });
      }
    } else if (sub === "list") for (const p of m.processes) console.log(`${p.name} pid ${p.pid}${p.side ? ` ${p.side}` : ""}${p.port ? ` port ${p.port}` : ""}: ${alive(p) ? "ALIVE" : "not running"}${p.cmd ? `  (${p.cmd})` : ""}`);
    else die("usage: proc add|list|stop");
  },
  report() {
    const run = runDir() ?? die("no run: start with `init`");
    const m = load(run);
    const md = reportMd(run, m);
    writeFileSync(join(run, "report.md"), `${md}\n`);
    writeFileSync(join(run, "report.html"), reportHtml(run, m, md));
    writeFileSync(join(run, "PLAN.md"), `${planMd(m)}\n`);
    journal(run, { event: "report" });
    for (const c of m.claims) console.log(`[${WORD[c.status]}] ${c.id}: ${c.text}`);
    console.log(`\n${join(run, "report.html")}\n${join(run, "report.md")}`);
  },
  close() {
    const { run, m } = open();
    const running = m.processes.filter(alive);
    if (running.length) die(`still running: ${running.map((p) => `${p.name} (pid ${p.pid})`).join(", ")}. Stop them with \`proc stop\` first`);
    const base = sideDir(run, m, "base");
    if (existsSync(base)) must(m.repo.path, "worktree", "remove", "--force", base);
    update(run, (mm) => void (mm.phase = "closed"));
    journal(run, { event: "close" });
    console.log(`closed ${run}`);
  },
  prune() {
    const h = here();
    const repoDir = join(proofRoot, h.slug);
    if (!existsSync(repoDir)) return console.log("nothing to prune");
    let found = 0;
    for (const branch of readdirSync(repoDir)) for (const name of readdirSync(join(repoDir, branch))) {
      const run = join(repoDir, branch, name);
      if (name === "latest" || !existsSync(join(run, "manifest.json"))) continue;
      const m = load(run);
      const gone = !git(h.top, "show-ref", "--verify", "--quiet", `refs/heads/${m.repo.branch}`).ok;
      const merged = !gone && m.repo.branch !== m.base.ref && git(h.top, "merge-base", "--is-ancestor", m.change.sha, m.base.ref).ok;
      if (m.phase !== "closed" || m.processes.some(alive) || !(gone || merged)) continue;
      found++;
      console.log(`${flag("yes") ? "removed" : "would remove"} ${run} (branch ${m.repo.branch} ${gone ? "is gone" : "is merged"})`);
      if (flag("yes") && run.startsWith(`${proofRoot}/`)) rmSync(run, { recursive: true, force: true });
    }
    console.log(found ? (flag("yes") ? "done" : "pass --yes to remove them") : "nothing to prune: only closed runs of gone or merged branches are removed");
  },
};

if (!command || !commands[command]) die(`unknown command "${command ?? ""}": status, init, claim, plan, approve, env, each, pair, compare, attach, block, note, proc, report, close, prune`);
await commands[command]();
