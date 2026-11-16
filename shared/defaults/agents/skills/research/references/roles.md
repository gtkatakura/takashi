# Roles and the round

## Roles

| Role | Does | Never | Model |
|---|---|---|---|
| Lead (main session) | Intake, charter, briefs, checkpoints, progress log, close | Writes a proposal, card or cell | session |
| Frame red team | Attacks question and premises before round 1 | Proposes a solution | other vendor, else default |
| Inventory agent | Lists units from one side (user, code, docs) | Reads a proposal or frozen material | sonnet |
| Scout | One angle, many candidates, one line and source each | Deepens a candidate | sonnet |
| Lens seat | Complete proposal for its lens, objections, rebuttals | Reads another seat while writing (round 1) | default |
| Fixed seat: simplicity skeptic | Hunts what can be cut or deferred | Is left out | default |
| Fixed seat: advocate of the alternative | Argues for not building, buying, or a competitor's way | Is left out | default |
| Fixed seat: operator | Thinks as whoever installs, runs and pays; demand only from the owner or a cited signal | Invents a customer | default |
| Judge | Decides each objection, keeps one register with stable ids, writes the synthesis, names spikes | Writes a proposal | default |
| Experimenter | Runs the judge's spikes on an isolated copy, saves files and logs | Uses a real credential; raises a level without a passing run | sonnet |
| Auditor | Reopens a seeded sample, fixes or downgrades, reports error rate | Is the judge | default |
| Mechanical checker | Confirms `path:line`, links, dates | Judges design | haiku |
| Final auditor | Audits the synthesis against sources | Receives the lead's opinion | other vendor, else default |

Agents do not talk to each other: each reads files in the study folder and writes its own file there. Per-study instructions for a role go in `briefs/<role>.md` and reach the agent as a path.

## A round

1. **Seats write.** Round 1 is blind. From round 2 each seat reads every proposal of the round before, answers objections addressed to it (accept, rebut with evidence, adjust), objects to others, and rewrites its whole proposal. From round 3 a seat changes a cell only with evidence that its value, level or text is wrong.
2. **Objections** have a target, a severity (BLOCKING, IMPORTANT, MINOR), a claim and evidence.
3. **Judge** decides each objection, rewrites the synthesis, names spikes and open divergences.
4. **Experimenter** runs the spikes. A cell rises to "run" only when a recorded command passed and executed the part its value rests on.
5. **Auditor** samples three pools — changed this round, never audited, drawn from the rest with a recorded seed — fixes what the source does not support, and reports the rate overall and per pool. In doubt, it overturns.
6. **Lead** checks real repos are untouched, runs the study's tools, numbers new objections from spikes and audit, logs the round and spend, amends role briefs under a dated heading.

A high error rate on never-audited cells is a backlog; on changed cells, a writer who does not check. When values stop moving but the audit still fails on old text, run a **verification round**: split the whole result into one share per seat, flag thin evidence by script, and have each seat re-read every cited line and return repairs (not objections); the judge applies a repair only after opening the lines.

Whoever writes before a later agent runs records where that agent's result will go, never its outcome.
