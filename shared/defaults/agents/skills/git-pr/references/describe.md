# Describe: PR descriptions and roadmap issues

## What goes where

| Roadmap / master-plan issue | PR description |
| --- | --- |
| What was delivered, at the macro level | How it was implemented |
| The decision taken and the flow that now exists | File-level changes, config, edge cases, test counts |
| What changed from the original plan | Known warnings, follow-ups (as checkboxes) |
| The contract later phases depend on | Verification steps |

## Rules

- **Describe the decision taken and the flow built**, never the rejected alternatives: they read as open questions.
- **"Repensa" / "rethink" means shorter.** Keep the decision, the flow and the contract later phases need; move details (cookie flags, CORS, log rules) to the PR.
- **Deferred work is one line** in a "Deferred / next phase" section, linking the PR or issue.
- **A phase is done only when verified:** the PR is merged (`gh pr view`), the staging endpoint answers (`curl`), cross-repo PRs are in the right state. Name what only a human can check, such as a real SSO login.
- **Keep the PR description current** whenever names, architecture, behavior, test counts, warnings or follow-ups change; keep the title in sync; date numbers that may go stale. Follow-ups found after merge go in a checkbox section of the merged PR.

## Editing safely

Others edit these bodies too.

1. Fetch the live body: `gh pr view <N> --json body -q .body > pr.md` (issue: `gh issue view <N> --json body -q .body > issue.md`).
2. Edit only the target section; replace text only after checking it occurs exactly once.
3. Diff, then apply: `gh pr edit <N> --body-file pr.md` (or `gh issue edit`).
