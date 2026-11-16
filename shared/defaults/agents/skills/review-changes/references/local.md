# Source: local changes

- Include staged and unstaged changes (`git status`, `git diff`, `git diff --cached`).
- If a base ref was given, also review the merge-base diff between it and `HEAD` (`git diff <ref>...HEAD`). Without one, determine the base safely from the upstream (`@{upstream}`) or the main branch, and report which ref you used.
- Run validations in the current worktree without changing it: no checkout, stash, reset or formatting writes.
- Do not report findings on unchanged files, except for the context strictly needed to validate integration.
