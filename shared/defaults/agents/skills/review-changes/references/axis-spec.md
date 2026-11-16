# Axis: Spec

Does the change do what was asked, all of it, and only that?

## Inputs

- The diff command and commit list.
- The spec the orchestrator found: the PR description and the issues it closes (`gh pr view <pr> --json body,closingIssuesReferences`, `gh issue view <n>`), issue references in commit messages, a path the user gave, or a spec under `docs/`, `specs/` or `.scratch/` matching the branch.

## What to report

1. Requirements the spec asked for that are missing or partial.
2. Behavior in the diff that was not asked for (scope creep), including changed defaults and removed behavior.
3. Requirements that look implemented, but where the implementation looks wrong.
4. Claims in the PR description or commit messages that the diff does not back (a test said to exist, a case said to be handled).

Quote the spec line for each finding.

## Output

Findings in the report format of `review-changes`. At most 400 words. If there is no spec, report "no spec available" and stop.
