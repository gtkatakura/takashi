# Teams

## Static analysis team

Reads both projects at the pinned tags and runs neither tool, only extraction scripts. Nothing it writes is above "read".

| Role | Does | Never | Model |
|---|---|---|---|
| Surface inventory agent | Lists the incumbent's units for one surface (once, before the baseline) | Reads the challenger or its compatibility table | sonnet |
| Usage scout | Counts usage, proposes each unit's weight, marks which profiles use it (at the baseline) | Gives a weight without a count | sonnet |
| Extractor | Writes the scripts that pull registries, schemas, flags, exports and test cases from both sides and diff them; runs them for the baseline and after a re-pin | Reads a diff as a verdict | sonnet |
| Signal scout | Collects migration reports, issues and stated non-goals from both trackers (at the baseline), as gap statuses and places to look | Treats a report as proof | sonnet |
| Static mapper | For the slice, gives each unit its counterpart, value, differences with lines on both sides, gap status; lists what the challenger offers that the incumbent lacks | Runs either tool; calls a name match `equivalent` | sonnet |

## Runtime validation team

Runs both tools on what the static team did not settle.

| Role | Does | Never | Model |
|---|---|---|---|
| Reproducer | Builds one minimal case per candidate (from the reference side's fixtures by script where they exist), runs it on both tools, records the result, proposes the class of each difference | Tunes a config in silence; uses a real credential; validates a cell it mapped | sonnet |
| Corpus runner | Counts the impact of confirmed gaps on the profiles' code, tries workarounds, proposes severities, runs the control sample | Reports a count without its command | sonnet |
| Benchmarker | Measures performance when the charter has it in focus | Compares unequal work | sonnet |

## Review

| Role | Does | Never | Model |
|---|---|---|---|
| Advocate, one per project | Reviews every cell, weight, severity, class and benchmark that is unfavourable to its project, and objects with evidence: wrong config, wrong version, a defect on the other side, a workaround not tried, a rule applied to one side only | Writes a cell; decides | default |
| Judge | Decides each objection and each disputed class or severity, keeps one register with stable ids, names new cases, writes the synthesis | Mapped a cell or was an advocate | default |
| Auditor | Reopens a seeded sample from both teams, reruns one command per sampled `run` cell, fixes or downgrades, reports the errors, their causes and which side they favoured | Is the judge | default |
| Mechanical checker | Confirms `path:line`, links, versions, dates | Judges a value | haiku |
| Frame red team | Attacks the frame before any cell exists | Proposes a verdict | another vendor, else default |
| Final auditor | Audits the synthesis against the matrix and the sources | Receives the lead's opinion | another vendor, else default |
| Lead (main session) | Intake, charter, briefs, increment plan and reports, checkpoints, close | Writes or changes a cell | session |

The two advocates have one brief, with the project names exchanged.

**Stake rule.** The frame red team and the final auditor go to a model from another vendor whenever one is available. When the owner has a stake in one project, the advocate of the other project does too.

Agents do not talk to each other: each reads files in the study folder and writes its own file there. Per-study instructions for a role go in `briefs/<role>.md` and reach the agent as a path.

## Reading the audit

- Errors that lean to one side: find the writer or the rule that produced the lean before the next increment.
- A high rate of refuted candidates: the static team is overcalling gaps on that surface. A high rate of control disagreements: it is overcalling parity. Either way, send that surface to runtime whole.
- A high error rate on never-audited cells is a backlog; on cells changed in this increment, a writer who does not check.
- An advocate with no objection says so in its file. Silence is not agreement.
