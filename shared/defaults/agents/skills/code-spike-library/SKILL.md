---
name: code-spike-library
description: Evaluate a proposed third-party library before adopting it — dependency compatibility, reading its source for the internals it relies on, and a throwaway PASS/FAIL spike per required capability. Use when the user says "use library X or something similar" ("usa a lib X ou algo parecido") or before replacing hand-written code with a dependency.
compatibility: Requires `npm` for npm packages or `go` for Go modules.
metadata:
  kind: workflow
  formerly: library-spike
---

# Spike a library before adopting it

A proposed library is adopted, or rejected for a better fit, on the evidence of a throwaway PASS/FAIL spike per capability the project needs.

## Steps

1. **Check compatibility.** npm: `npm view <pkg> version peerDependencies dependencies` against the project's framework and runtime. Go: `go list -m -versions <module>`, its `go.mod`, and `go mod why -m <dep>` after a trial `go get`.
2. **Look for alternatives** when it does not fit: the author's framework-free core, maintained forks, or the capability in a library already in use.
3. **Read the installed source** (`node_modules/<pkg>`, `$(go env GOMODCACHE)/<module>@<version>`) for the internals it relies on, and confirm they exist in your version.
4. **Spike** one PASS/FAIL check per capability, in a folder excluded from builds (`__spike__/`). Note each workaround with the check that proved it.
5. **Migrate** once the user agrees: adopt it, delete the hand-written code it replaces, delete the spike.

## Done when

- Every required capability has a PASS or FAIL, and every workaround its proving check.

## Report

The library picked, why the obvious one did not fit, PASS/FAIL per capability, and the workarounds.

## References

- `references/example.md` (~150 tokens): a complete spike (offline data for a Relay app).
