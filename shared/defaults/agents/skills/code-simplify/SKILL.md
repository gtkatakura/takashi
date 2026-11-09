---
name: code-simplify
description: Refactor/simplify code in small verified steps — one simplification per commit, understand why code exists before deleting it, bugs found become separate fix commits. Use when the user says "refactor", "simplify", "de novo/again", or asks to clean up a branch.
compatibility: Requires `git`.
metadata:
  kind: workflow
  formerly: incremental-simplification
---

# Simplify code

Code gets simpler in small, separately verified commits; behavior stays the same unless a commit says otherwise.

## Steps

1. **Set the scope.** On "again" / "de novo", widen it to everything the branch touched (`git diff --stat origin/main...HEAD`), shared packages and test helpers included.
2. **Learn why code exists before removing it.** An "unused" function may be duplicated by hand elsewhere: call it there. Count an export's uses (`git grep -lw <name>`). Compatibility code on a never-shipped branch just goes, untested.
3. **One simplification per commit**, then typecheck, lint, unit tests and the affected e2e. Bundled "refactor" commits were rejected as hard to review and bisect.
4. **A wanted behavior change** gets its own commit, called out. **A bug found on the way** gets its own `fix:` commit, with a test that fails on the old code, after a probe confirms it.
5. **After changing a shared export**, test every package that uses it. Ask before touching other teams' consumers, and do it in a separate PR.

## Typical moves

- Nested ternary → if/return or a lookup `Record`. Nested spreads → named steps.
- A repeated check → a named predicate (keep it equivalent: De Morgan). A repeated call sequence → a helper, in tests too.
- Drop leftover wrappers and abbreviations; declare module state before its users; keep doc comments on the right symbol; narrow mocks to what the code calls.
- React effects: follow the repo's React patterns if it has them; otherwise prefer render → handler → data layer → `useSyncExternalStore` → `key` → module factory → ref callback → effect.

## Done when

- Every commit passes the gates on its own, and behavior is unchanged except where a commit says so.

## Report

The commits (one line each), what you left alone and why, any behavior changes, and the decisions still open.
