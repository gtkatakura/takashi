#!/usr/bin/env bun
// Deterministic commit watcher: costs zero tokens until a new commit lands. Run from inside the repository.
//
//   bun watch-commits.ts                 prints NO_NEW_COMMITS <sha> | NEW_COMMITS <a>..<b> and git log --stat
//   bun watch-commits.ts --ack <sha>     records <sha> as the last reviewed commit
//   bun watch-commits.ts --wait [secs]   blocks (checks every 15s) until the branch moves, then reports;
//                                        prints TIMEOUT <sha> after secs (default 3300)
// Env:
//   BRANCH   branch to watch (default: current branch)
//   FETCH=1  fetch and watch the remote branch (origin/<BRANCH>), to see commits someone else pushes
//   EXCLUDE  space-separated pathspec globs left out of the stat (default: lockfiles and **/__generated__/**)
//   STATE    file holding the last reviewed sha (default: $TMPDIR/<repo>-<branch>.last-reviewed)
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

function git(...args: string[]): string {
  const p = Bun.spawnSync(["git", ...args], { stdin: "ignore", stdout: "pipe", stderr: "pipe" });
  if (p.exitCode !== 0) {
    console.error(p.stderr.toString().trim());
    process.exit(p.exitCode ?? 1);
  }
  return p.stdout.toString().trim();
}

const repo = basename(git("rev-parse", "--show-toplevel"));
const branch = process.env.BRANCH || git("rev-parse", "--abbrev-ref", "HEAD");
const fetch = process.env.FETCH === "1";
const ref = fetch ? `origin/${branch}` : branch;
const state = process.env.STATE || join(process.env.TMPDIR || tmpdir(), `${repo}-${branch.replaceAll("/", "-")}.last-reviewed`);
const exclude = (process.env.EXCLUDE ?? "**/__generated__/** bun.lock package-lock.json pnpm-lock.yaml yarn.lock go.sum").split(/\s+/).filter(Boolean);

function headSha(): string {
  if (fetch) git("fetch", "-q", "origin", branch);
  return git("rev-parse", ref);
}
const lastReviewed = () => readFileSync(state, "utf8").trim();
if (!existsSync(state)) writeFileSync(state, `${headSha()}\n`);

function report(): void {
  const last = lastReviewed();
  const now = headSha();
  if (last === now) return void console.log(`NO_NEW_COMMITS ${now}`);
  console.log(`NEW_COMMITS ${last}..${now}`);
  console.log(git("log", "--stat", "--format=%n%h %s", `${last}..${now}`, "--", ".", ...exclude.map((p) => `:(exclude,glob)${p}`)));
}

const [mode, arg] = process.argv.slice(2);
if (mode === "--ack") {
  if (!arg) throw new Error("--ack needs a sha");
  writeFileSync(state, `${arg}\n`);
  console.log(`ACKED ${arg}`);
} else if (mode === "--wait") {
  const deadline = Date.now() + Number(arg ?? 3300) * 1000;
  while (lastReviewed() === headSha()) {
    if (Date.now() >= deadline) {
      console.log(`TIMEOUT ${headSha()}`);
      process.exit(0);
    }
    await Bun.sleep(15_000);
  }
  report();
} else {
  report();
}
