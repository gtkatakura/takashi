// Long-session suite: one Claude Code session with many turns, each producing large tool output
// (pytest, git log/diff, MCP JSON, logs, build). This is the scenario RTK, context-mode and headroom
// each name as their best case. Usage: bun long.ts <dir>
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { build, type Task } from "./fixtures";
import { orders, incidents } from "./long-data";

export function buildLong(dir: string): Task[] {
  const fx = build(dir); // app.log, users.json, run-tests.sh, build.sh
  const answer = (id: string) => fx.find((t) => t.id === id)!;

  // Python project: 60 modules x 25 tests, noisy (prints and warnings), 4 failures with long diffs.
  mkdirSync(join(dir, "tests"), { recursive: true });
  const failing = new Map([["test_m07", 13], ["test_m22", 4], ["test_m38", 21], ["test_m51", 9]]);
  for (let m = 0; m < 60; m++) {
    const mod = `test_m${String(m).padStart(2, "0")}`;
    const lines = ["import warnings", ""];
    for (let t = 0; t < 25; t++) {
      const fail = failing.get(mod) === t;
      lines.push(`def test_case_${t}():`,
        `    print("setup ${mod}.${t}: " + "x" * 120)`,
        `    warnings.warn("deprecated config key in ${mod}", DeprecationWarning)`,
        fail ? `    assert {"rows": list(range(40)), "ok": True} == {"rows": list(range(41)), "ok": True}` : `    assert sum(range(${t + 3})) == ${((t + 3) * (t + 2)) / 2}`, "");
    }
    writeFileSync(join(dir, "tests", `${mod}.py`), lines.join("\n"));
  }
  writeFileSync(join(dir, "pytest.ini"), "[pytest]\naddopts = -rA\n");

  // Git history: 1500 commits; one "ledger hotfix"; tag v1.0 at 1200; one file dominates changes after it.
  const g: string[] = [];
  let mark = 0;
  const files = ["api/routes.py", "core/ledger.py", "core/money.py", "ui/cart.ts", "ui/checkout.ts", "lib/retry.py", "docs/CHANGELOG.md"];
  const content: Record<string, string[]> = Object.fromEntries(files.map((f) => [f, ["# " + f]]));
  for (let i = 0; i < 1500; i++) {
    const f = i >= 1200 && i % 3 === 0 ? "core/money.py" : files[i % files.length];
    const n = f === "core/money.py" && i >= 1200 ? 12 : 3;
    for (let k = 0; k < n; k++) content[f].push(`line ${i}.${k} ${"v".repeat(30)}`);
    const msg = i === 873 ? "ledger hotfix: clamp negative balances before settlement" : `${["feat", "fix", "chore", "refactor"][i % 4]}(${f.split("/")[0]}): change ${i} in ${f}`;
    const body = content[f].join("\n") + "\n";
    g.push(`commit refs/heads/main`, `mark :${++mark}`, `committer Dev <dev@example.com> ${1760000000 + i * 3600} +0000`,
      `data ${Buffer.byteLength(msg)}`, msg, `M 100644 inline ${f}`, `data ${Buffer.byteLength(body)}`, body);
    if (i === 1199) g.push(`reset refs/tags/v1.0`, `from :${mark}`, "");
  }
  writeFileSync(join(dir, ".fast-import"), g.join("\n") + "\n");
  const sh = (cmd: string[]) => { const p = Bun.spawnSync(cmd, { cwd: dir, stdin: Bun.file(join(dir, ".fast-import")) }); if (p.exitCode) throw new Error(p.stderr.toString()); return p.stdout.toString(); };
  sh(["git", "init", "-q", "-b", "main"]);
  sh(["git", "fast-import", "--quiet"]);
  Bun.spawnSync(["rm", join(dir, ".fast-import")]);
  sh(["git", "checkout", "-q", "main"]);
  // Fixture files stay untracked on purpose: they are inputs, not history.
  const hotfix = sh(["git", "log", "--format=%h", "--grep=ledger hotfix"]).trim();

  const failedOver900 = orders.filter((o) => o.status === "failed" && o.amount > 900).length;
  const sev1: Record<string, number> = {};
  for (const x of incidents) if (x.severity === "sev1") sev1[x.service] = (sev1[x.service] ?? 0) + 1;
  const topSev1 = Object.entries(sev1).sort((a, b) => b[1] - a[1])[0][0];

  const end = "End your reply with a line `ANSWER: <answer>`.";
  return [
    { id: "pytest", prompt: `Run the Python test suite with pytest. Which tests fail? Give each as module::test. ${end}`,
      expect: [...failing].map(([m, t]) => `${m}.py::test_case_${t}`) },
    { id: "git-log", prompt: `In this repo's git history, which commit is the ledger hotfix? Give its short hash. ${end}`, expect: [hotfix] },
    { id: "git-diff", prompt: `Which file has the most changed lines between tag v1.0 and HEAD? ${end}`, expect: ["core/money.py"] },
    { id: "mcp-orders", prompt: `Use the shop MCP server: how many failed orders have an amount above 900? ${end}`, expect: [String(failedOver900)] },
    { id: "mcp-incidents", prompt: `Use the shop MCP server: which service had the most sev1 incidents? ${end}`, expect: [topSev1] },
    { ...answer("log-fatal"), id: "log" },
    { ...answer("build"), id: "build" },
    { ...answer("json-admins"), id: "json" },
    { id: "summary", prompt: `Of everything you found in this session, what is the single most urgent problem, and why? Keep it to a short paragraph. ${end}`,
      expect: ["ANSWER:"], grade: "text" },
  ];
}

if (import.meta.main) {
  const dir = process.argv[2] ?? "long";
  for (const t of buildLong(dir)) console.log(t.id, "->", t.expect.join(", "));
}

