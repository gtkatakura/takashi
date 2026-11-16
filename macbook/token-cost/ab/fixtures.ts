// Deterministic fixtures for the context-mode A/B. Every task has large text output and a known answer.
// Usage: bun fixtures.ts <dir>
import { mkdirSync, writeFileSync, chmodSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";

// grade "text": expect is checked against the whole reply (explanations), not only the ANSWER line.
export type Task = { id: string; prompt: string; expect: string[]; reject?: string[]; grade?: "answer" | "text" };

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function build(dir: string): Task[] {
  mkdirSync(join(dir, ".data"), { recursive: true });
  const r = rng(42);
  const pick = <T>(a: T[]) => a[Math.floor(r() * a.length)];
  const hex = (n: number) => Array.from({ length: n }, () => Math.floor(r() * 16).toString(16)).join("");

  // app.log: 60k lines, one FATAL, ERROR counts per service.
  const services = ["auth", "billing", "search", "catalog", "orders", "notify"];
  const errors: Record<string, number> = Object.fromEntries(services.map((s) => [s, 0]));
  const fatalAt = 41_337, fatalId = `req-${hex(12)}`;
  const log: string[] = [];
  for (let i = 0; i < 60_000; i++) {
    const ts = new Date(Date.UTC(2026, 10, 1) + i * 1370).toISOString();
    if (i === fatalAt) { log.push(`${ts} FATAL [orders] request_id=${fatalId} unrecoverable state in ledger reconciliation`); continue; }
    const svc = pick(services), x = r();
    // billing gets a few more errors, so the winner is unambiguous.
    const lvl = x < (svc === "billing" ? 0.031 : 0.02) ? "ERROR" : x < 0.08 ? "WARN" : "INFO";
    if (lvl === "ERROR") errors[svc]++;
    log.push(`${ts} ${lvl} [${svc}] request_id=req-${hex(12)} latency_ms=${Math.floor(r() * 900)} path=/api/${svc}/${hex(6)} msg="${pick(["ok", "cache miss", "retrying upstream", "slow query", "timeout talking to db", "validation failed"])}"`);
  }
  writeFileSync(join(dir, "app.log"), log.join("\n") + "\n");
  const [topSvc, topN] = Object.entries(errors).sort((a, b) => b[1] - a[1])[0];

  // users.json: 20k records.
  const users = Array.from({ length: 20_000 }, (_, i) => ({
    id: i + 1, email: `user${i + 1}@example.com`, role: pick(["admin", "editor", "viewer", "viewer", "viewer"]),
    status: pick(["active", "active", "suspended", "invited"]), joined: `${pick([2022, 2023, 2024, 2025])}-${String(1 + Math.floor(r() * 12)).padStart(2, "0")}-15`,
    plan: pick(["free", "pro", "team"]), tags: [pick(["beta", "legacy", "vip", "trial"]), pick(["eu", "us", "apac"])],
  }));
  writeFileSync(join(dir, "users.json"), JSON.stringify(users, null, 2));
  const admins = users.filter((u) => u.role === "admin" && u.status === "active" && u.joined.startsWith("2024")).length;

  // run-tests.sh: ~9k lines of test output, 3 failures, failure details buried in the middle.
  const failing = new Set([1873, 4410, 7702]);
  const testName = (i: number) => `${pick(["api", "db", "ui", "worker"])}/${hex(4)}.test.ts > ${pick(["handles", "rejects", "renders", "retries"])} case ${i}`;
  const tests: string[] = [], failNames: string[] = [];
  for (let i = 0; i < 9_000; i++) {
    const name = testName(i);
    if (failing.has(i)) {
      failNames.push(String(i)); // graded on the number, so "1873" and "case 1873" both pass
      tests.push(`  ✗ ${name}`, `    AssertionError: expected ${Math.floor(r() * 99)} to equal ${Math.floor(r() * 99)}`, `      at ${hex(8)}.ts:${Math.floor(r() * 300)}:${Math.floor(r() * 40)}`);
    } else tests.push(`  ✓ ${name} (${Math.floor(r() * 120)}ms)`);
  }
  tests.push("", `Tests: 3 failed, 8997 passed, 9000 total`);
  writeFileSync(join(dir, ".data/tests.gz"), gzipSync(tests.join("\n") + "\n"));
  writeFileSync(join(dir, "run-tests.sh"), "#!/bin/bash\ngzip -dc \"$(dirname \"$0\")/.data/tests.gz\"\nexit 1\n");
  chmodSync(join(dir, "run-tests.sh"), 0o755);

  // build.sh: ~10k warning lines, one error.
  const errFile = `src/billing/${hex(6)}.ts`, errLine = 1 + Math.floor(r() * 400);
  const build: string[] = [];
  for (let i = 0; i < 10_000; i++) {
    if (i === 6_123) { build.push(`${errFile}:${errLine}:9 - error TS2345: Argument of type 'string' is not assignable to parameter of type 'Money'.`); continue; }
    build.push(`src/${pick(["api", "ui", "core", "lib"])}/${hex(6)}.ts:${Math.floor(r() * 500)}:${Math.floor(r() * 60)} - warning TS6133: '${hex(5)}' is declared but its value is never read.`);
  }
  build.push("", "Found 1 error and 9999 warnings.");
  writeFileSync(join(dir, ".data/build.gz"), gzipSync(build.join("\n") + "\n"));
  writeFileSync(join(dir, "build.sh"), "#!/bin/bash\ngzip -dc \"$(dirname \"$0\")/.data/build.gz\"\nexit 2\n");
  chmodSync(join(dir, "build.sh"), 0o755);

  const end = "End your reply with a line `ANSWER: <answer>`.";
  return [
    { id: "log-fatal", prompt: `app.log has exactly one FATAL entry. What is its request_id? ${end}`, expect: [fatalId] },
    { id: "log-errors", prompt: `In app.log, which service has the most ERROR lines, and how many? ${end}`, expect: [topSvc, String(topN)] },
    { id: "json-admins", prompt: `In users.json, how many users have role "admin", status "active" and joined in 2024? ${end}`, expect: [String(admins)] },
    { id: "tests", prompt: `Run ./run-tests.sh. Which tests fail? Give the "case N" of each failing test. ${end}`, expect: failNames },
    { id: "build", prompt: `Run ./build.sh. It fails with one error among many warnings. Give the file:line of the error. ${end}`, expect: [`${errFile}:${errLine}`] },
  ];
}

if (import.meta.main) {
  const tasks = build(process.argv[2] ?? "fixtures");
  for (const t of tasks) console.log(t.id, "->", t.expect.join(", "));
}
