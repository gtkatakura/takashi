# Axis: Failures

Can the change lose or corrupt data, return wrong results, hang, leak, or let the wrong caller in?

## Inputs

- The diff command and commit list, and the validation results the orchestrator already has.
- `failure-modes.md` in this folder: read it in full first. It holds seven families of defect classes (concurrency and shared state; writes that must survive a failure; error handling; time, limits and resources; authority and trust boundaries; comparisons, numbers and data fidelity; divergence and stale state), each with its source, cues and usual fix.

## Rules

- **A finding names its class and a concrete scenario**: this input or state, then this wrong outcome. For example: "Lost update: `Reserve` reads the day's spend and writes spend plus cost back in two calls, so two requests for one key both pass the check and the daily limit is exceeded." A cue without a scenario is not a finding.
- **Evidence is stated**: *confirmed* (a failing test or a reproduction, with the command) or *plausible* (the scenario, not reproduced).
- **Confirm without touching anything shared.** Write the test in a throwaway worktree (`git worktree add` in `$TMPDIR`), run only unit tests and read-only commands, never against providers, shared databases or queues, and remove the worktree at the end. Never change the reviewed tree.
- **Test the tests.** For a test the change adds as proof of a fix, revert the production hunk in the throwaway worktree and run it: a test that still passes proves nothing.
- **Variant analysis.** For each confirmed finding, search the whole repository, not only the diff, for the same pattern, and list the siblings (one line per file).
- **One cause, many findings.** When two or more findings share a class, name the single design decision behind them.
- Report only defects that change behavior. Style, naming and structure belong to the Standards axis.

## Output

At most 8 findings, most severe first (data loss and security, then wrong results, then degraded service), in the report format of `review-changes`, with the class and its source in the title.
