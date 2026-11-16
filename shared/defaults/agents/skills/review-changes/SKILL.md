---
name: review-changes
description: Critical, read-only review of a GitHub PR, local changes, or an implementation plan along three axes — Standards (repo standards and code smells), Spec (does it do what was asked) and Failures (can it lose data, hang, leak or let the wrong caller in, checked against a catalog of known defect classes). Use when the user asks to review a PR, a diff, a branch or a plan ("revisa esse PR", "revisa minhas alterações"), or runs /review-pr, /review-local or /review-plan.
compatibility: Requires `git`; reviewing a pull request also requires an authenticated `gh`.
metadata:
  kind: workflow
  formerly: critical-review
---

# Review changes

A read-only review of a pull request, local changes or a plan on three separate axes, every finding backed by evidence:

- **Standards**: does it follow the repository's documented standards, and does its shape hold up?
- **Spec**: does it do what was asked, all of it, and only that?
- **Failures**: can it lose or corrupt data, return wrong results, hang, leak, or let the wrong caller in?

The axes stay separate: idiomatic code that does what was asked can still lose data when a write fails halfway. Never change files in the reviewed project.

## When not to use

- To fix what the review finds: review first, fix in the main session.

## Steps

1. **Pin the scope** with the source's procedure (see References): the diff command and the commit list. Stop if the diff is empty. For large changes (roughly 40+ files or 1,500+ changed lines, without lockfiles and generated code), say so, go deep on contracts, data, auth and concurrency, and list what got only a skim.
2. **Find the spec**: the PR description and the issues it closes, issue references in commits, a path the user gave, or a spec under `docs/`, `specs/` or `.scratch/`. None means Spec reports "no spec available".
3. **Find the standards**: `AGENTS.md`, `CONTRIBUTING.md`, `CODING_STANDARDS.md`, `docs/adr/`, `GLOSSARY.md`, the project's own skills, and any specialist review skill installed for the area the change touches (CI, Kubernetes, agent docs). Load `work-verify-claims`.
4. **Validate once**, where the source's procedure says: affected tests and the configured lint, formatter, type checking and static analysis. Keep each command and result for the axes.
5. **Run the axes**, each with its brief (see References). With subagents, run them in parallel as read-only `explore` subagents, briefed with the diff command, commit list, validation results, the spec or standards paths, and the absolute path of their axis file. Without, run them one after another and keep their notes apart.
6. **Check before reporting**: every finding has a location and a scenario; "confirmed" only where a test, script or run showed it, otherwise "plausible". Work a commit message claims but the diff lacks is a finding.

## Done when

- Each axis has findings, or says it found none and names the residual risks or validation gaps.
- Every validation is listed with its command and result, and every skipped one with the reason.
- The reviewed checkout is unchanged, and your worktrees and clones are removed.

## Report

One section per axis (**Standards**, **Spec**, **Failures**), findings by severity within each; never merge or rerank across axes.

| Severity | Meaning |
| --- | --- |
| `blocker` | Must not merge: data loss, security hole, broken build or contract, a crash on a main path |
| `high` | A real bug or risk on a realistic path; fix before merge unless the user accepts it |
| `medium` | A bug on an edge path, a missing test for a risky path, or a design flaw that will cost later |
| `low` | Small correctness or maintainability issue with limited impact |
| `suggestion` | Optional simplification or cleanup with a concrete benefit |

```markdown
### [severity] Short title (Failures: the defect class and its source)

- **Location:** `path:line`, or the plan's item/section
- **Problem:** objective description
- **Scenario:** this input or state → this wrong outcome
- **Evidence:** confirmed (the test or command) | plausible
- **Recommendation:** objective fix
- **Siblings:** other places with the same pattern (confirmed Failures findings)
```

Then **Validations run**, **Merge blockers** (the `blocker` findings of any axis, or "None."), and one closing line: findings per axis and the worst within each. Write in the user's language; cite precise paths and lines.

## References

| Read | When |
| --- | --- |
| `references/pr.md` (~250 tokens) | The source is a GitHub pull request: metadata, diff, throwaway worktree |
| `references/local.md` (~150 tokens) | The source is local changes, optionally against a base ref |
| `references/plan.md` (~100 tokens) | The source is an implementation plan |
| `references/axis-standards.md` (~800 tokens) | Running the Standards axis, with the smell baseline |
| `references/axis-spec.md` (~250 tokens) | Running the Spec axis |
| `references/axis-failures.md` (~550 tokens) | Running the Failures axis |
| `references/failure-modes.md` (~4,500 tokens) | Read by the Failures axis only: the defect-class catalog |
