# Ship: push and follow CI

1. **Push**, only when asked.
2. **Watch CI as a background job**, never with sleep-and-poll turns: `gh pr checks <N> --watch --interval 30` (opencode shell `background: true`; Claude Code `run_in_background: true`; pi: foreground with a timeout). If `--watch` hangs after the jobs finish, check `gh pr checks <N> --json name,state,link`. One watcher at a time.
3. **Confirm CI ran on your commit**: `gh pr view <N> --json headRefOid` equals `git rev-parse HEAD`.
4. **Confirm the new tests ran**, from the job log (`gh run view --log-failed` fails while the run is in progress):
   ```bash
   gh api repos/<o>/<r>/actions/jobs/<job-id>/logs | sed 's/\x1b\[[0-9;]*m//g' | grep -E 'pass|fail'
   ```
5. **Triage failures:**
   - e2e red in CI but green locally: reproduce under load before calling it flaky (Playwright `--repeat-each=10 --workers=5`). One such failure was a real data-loss race.
   - TS1149 on Linux (a file name that differs only in case): a case-only rename on macOS (case-insensitive filesystem): rename in two steps, `git mv a tmp && git mv tmp A`.
   - Possibly pre-existing: check on the base branch (or with `git stash`) before saying so.
