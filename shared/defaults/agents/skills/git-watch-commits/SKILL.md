---
name: git-watch-commits
description: Review (or fix) every new commit on a branch against a checklist/handoff file, using a deterministic watcher that spends tokens only when a commit lands. Use when the user wants follow-ups tracked across commits, a "loop" that reviews new commits, or a handoff of improvements someone else will implement.
compatibility: Requires `git` and `bun`; works best where the harness runs background shell jobs (opencode, Claude Code).
metadata:
  kind: workflow
  formerly: commit-watch-loop
---

# Watch commits

Each new commit on a branch is reviewed (or fixed) against one checklist file, and nothing is spent while no commit lands.

## When not to use

- A one-off review of a branch: use `review-changes`.
- Timers, scheduled wakeups, `/loop` or cron: only a new commit should cost tokens.

## Steps

1. **Write the checklist** from `assets/checklist.md`, default `$TMPDIR/<topic>-handoff.md`: every item with an ID and a `file:line`. For "improvements that don't change the idea", design changes go to the out-of-scope list, never dropped.
2. **Offer the watcher; never start it unasked.** Then run `bun scripts/watch-commits.ts --wait` (from this skill's folder, inside the repository) as a background job: opencode shell `background: true`, Claude Code `run_in_background: true`; its exit wakes you. pi has no background jobs: foreground with a timeout, and say it blocks the session. `FETCH=1` watches `origin/<branch>` for others' pushes. Tell the user it dies with the session; `pgrep -fl watch-commits` shows whether it runs.
3. **Review each round**: `git show <sha>` without generated files and lockfiles; check each commit message against its diff (claimed but unfinished items are common). Mark `[x] (sha)` only when the goal is met; note partial fixes; add `N` items for new gaps inside the original premise, regressions included.
4. **Close the round**: `--ack <sha>`, start `--wait` again, report.

## Fix mode

When asked to fix instead of review: touch nothing if `git status` shows someone else's work; get a green test baseline; fix the open items without changing the design; run typecheck, lint, tests, build and format check; revert each fix once to see its regression test fail; commit only if `HEAD` has not moved (`test "$(git rev-parse HEAD)" = <reviewed-sha> && git commit ...`); `--ack` your own commit.

## Done when

- Every item is `[x]` with its sha, or the user stops the loop; no watcher left running unless wanted.

## Report

Each round: **Done**, **Still open**, **New items**, and the most important item.

## References

- `assets/checklist.md` (~100 tokens): the checklist template.
- `scripts/watch-commits.ts`: the watcher (`--wait`, `--ack`, report); env vars in its header.
