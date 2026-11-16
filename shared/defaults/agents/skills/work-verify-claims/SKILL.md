---
name: work-verify-claims
description: Evidence standards before saying something works, is done, or is a bug — run the real stack end to end, check claims against installed library source, separate verified from inferred. Use when the user asks "funciona tudo?", "o que falta?", "está bom?", "falta algo?", or before reporting a task/phase complete.
user-invocable: false
metadata:
  kind: guide
  formerly: verify-before-claiming
---

# Verifying before claiming

Applies before saying something works, is done, or is a bug, and to "funciona tudo?", "o que falta?", "está bom?".

## Rules

- **Label every claim**: verified (you ran something that showed it) or inferred (you read code or docs). An unlabeled inference reads as a fact.
- **"It works" means the real pieces together**, never two separately green halves (a web app against a fake, an API against scripts): after a contract change, run the real client against the real API and database. A short browser script with a real login (`playwright-core`) covering load, create, update, relations, deep-link reload, delete, failed requests and console errors is enough. Stop the servers you started.
- **Library and runtime behavior comes from the installed source** (`node_modules/<pkg>`, `$(go env GOMODCACHE)`) or a scratch script in the real runtime, never memory: they differ in exactly the details that matter.
- **Check commit messages against diffs**: claimed but missing work is a finding. Say whether tests ran ("read-only; tests not run").
- **Say plainly what does not work or was not tested** (limits, warnings, staging state, SSO), not in a footnote.
- **Self-assessment** ("are the tests good?", "what's left?"): what is solid; a numbered list of what is missing or weak; an offer to implement it. Implement when told; do not defend the work.
- **Status reports**: what was done (commit SHAs), what was verified (counts), whether CI was checked, what is open, and the decisions needed, each with a recommendation.
- **Review findings** use the `review-changes` format.

## Examples

- `references/examples.md` (~200 tokens): cases where answering from memory was wrong.
