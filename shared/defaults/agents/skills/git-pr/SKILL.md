---
name: git-pr
description: Ship a branch and keep its PR honest — push, watch CI without burning tokens, confirm CI ran the new tests on HEAD, triage failures — and write PR descriptions and roadmap issues (what goes where). Use for "push e veja CI green", "push and check CI", "update the PR description", "atualiza a issue do roadmap", "marca a fase como feita", or any push to an open PR.
compatibility: Requires `git` and an authenticated `gh`.
metadata:
  kind: workflow
  formerly: [git-ship-pr, git-write-pr-and-roadmap, ship-pr-ci, roadmap-issue-and-pr-writing]
---

# Pull requests

A branch reaches green CI on its head commit, and its PR description (and the roadmap issue, when there is one) says what exists now.

## When not to use

- Pushing unasked: push only when the user asks or their instruction includes it ("push e veja ci green").

## Steps

1. **Ship**: push, watch CI, confirm it ran the new tests, triage failures (`references/ship.md`).
2. **Describe**: update the PR description, and the roadmap issue when a phase moved (`references/describe.md`).

## Done when

- Every check is green on the commit equal to `git rev-parse HEAD`, and the logs show the new tests running.
- The PR title and description, and the roadmap issue, match what was built.

## Report

Each check and its state, the head SHA, whether you waited for CI (say so if you did not), what is still red and why, and what changed in the description or issue.

## References

| Read | When |
| --- | --- |
| `references/ship.md` (~300 tokens) | Pushing and following CI |
| `references/describe.md` (~400 tokens) | Writing or updating a PR description or a roadmap/master-plan issue |
