# Source: a GitHub pull request

- If the URL or number is missing, invalid or inaccessible, report the error and stop.
- Get the metadata, base, commits and diff with `gh pr view <pr> --json title,body,baseRefName,headRefOid,commits,files` and `gh pr diff <pr>`.
- Run validations in a throwaway worktree at the PR's HEAD commit, outside the repository (in `$TMPDIR`): `git fetch origin pull/<n>/head` and `git worktree add --detach <dir> FETCH_HEAD`. If the current directory is not the PR's repository, make a shallow clone in `$TMPDIR` instead. Run the relevant tests, lint, formatter, type checking and static analysis there.
- Remove the worktree or clone when done, even on failure (`git worktree remove --force <dir>`). Never change the original worktree.
- Findings are scoped to the files changed in the PR. Read additional context only to validate how the changes integrate with the system.
