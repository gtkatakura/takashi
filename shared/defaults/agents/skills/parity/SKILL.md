---
name: parity
description: Compare a challenger project with the incumbent it wants to replace as-is (oxlint vs ESLint, Biome vs Prettier, Bun vs Node) and map every gap fairly, in increments — a blind inventory of the incumbent's whole surface weighted by counted usage, a scripted baseline of all of it, then slice by slice a static analysis team that maps each unit from source, tests and schemas, and a runtime validation team that runs both tools on what reading did not settle, with an advocate for each side, a judge and an audit. Each increment ends in a coverage ledger and a verdict range per kind of adopter. Use for "X já substitui Y?", "quais gaps faltam para X substituir Y", "compara X e Y de forma justa", "drop-in replacement", "/parity". One feature takes the short path; options with no incumbent to match is `research`.
metadata:
  kind: workflow
---

# Parity

A challenger says it replaces an incumbent as-is. A parity study says for whom that holds today, which gaps remain, and how each one was shown. It is a snapshot of two pinned versions and it grades both projects by the same rules.

It is built breadth first, then in increments: the whole surface is listed and given a provisional value by script, then covered slice by slice, each slice ending in a report the owner answers. The owner has a usable picture after the baseline and a narrower one after every increment. A study that cannot name the decision it supports does not start.

## Pick the path

- **Short path**: one unit ("does oxlint have `no-unused-vars` with the same options?"). Read the challenger's docs, source and tests; unless that settles it as equivalent, run one case on both tools. Answer with the parity value and the proof level.
- **Full study**: the replacement claim as a whole, or for a kind of adopter. Run every step below.
- **Not a replacement question** (several options, no incumbent to match): use `research`.

## Steps

1. **Intake.** Read what exists (both repositories, the challenger's compatibility page, earlier studies and their saved cases) and ask only what it does not answer: `references/intake.md`, up to four questions per batch, each with a recommended answer. Record the owner's stake in either project.
2. **Charter.** Write `CHARTER.md` (`references/intake.md` template): the decision, the claim under test in the challenger's own words, the adopter profiles, both versions and the cut date, surfaces and their boundary, what counts as equivalent, floors, corpus, what may run, teams, budget. **The owner releases it.**
3. **Frame attack.** One agent attacks the frame before any cell exists and writes `frame.md`: are the profiles real adopters, does the surface list or its boundary favour a side, is "as-is" the claim the challenger makes, does every rule of the charter pass the swap test. An accepted BLOCKING objection changes the charter, and the owner releases it again.
4. **Surface inventory, blind and whole.** Agents that have not seen the challenger list what a user of the incumbent relies on, one agent per surface (`references/fairness.md`). This list is the denominator of every later count. Send the owner the counts per surface as a note, and go on.
5. **Baseline** (`references/increments.md`). Scripts only: usage is counted and every unit weighed; extraction scripts diff the whole surface of both projects and the challenger's own compatibility table; every unit a script can reach gets a provisional value. Out comes the first ledger, a verdict range per profile, and the increment plan: a pilot of about a dozen `core` units, then by weight. **The owner sees the baseline report and releases the order.**
6. **Increments** (`references/increments.md`). Each is a full slice. The static team maps the slice's units, and what the challenger offers there that the incumbent lacks, with neither tool run. Every cell that reading did not settle as `equivalent` becomes a candidate. The runtime team runs one case per candidate on both tools, plus a seeded control sample of what reading settled. The advocates object, the judge decides, the auditor samples. The increment report goes to the owner. **The owner answers: go on, reorder, widen, drop, or correct a weight or a definition.**
7. **Synthesis**, when the study is complete or the owner stops. The gap matrix (every cell: value, proof level, evidence, both versions), a verdict per profile, the gaps ranked by weight and severity (each with workaround and status), the reverse gaps, defects found in either project, what the study does not claim or did not cover, and which event reopens it. A final auditor who is not the judge checks it; a closing pass answers that audit.
8. **Close.** Write what changed and what was overturned, spend per agent with its model, and a five-line retro. Amend this method when the retro says so.

## Rules

- **Complete in the end, useful at every increment.** The ledger gives each inventoried unit one state. While a unit a profile uses is still open, that profile's verdict is a range, at best and at worst (`references/fairness.md`).
- **Breadth before depth.** Every unit a script can reach gets a provisional value before any unit gets an agent. Depth then goes where the weight is.
- **Static first, runtime on what is left.** Static analysis covers every unit and runs neither tool. Runtime covers the candidates, disputed cells, the control sample and performance; it does not rerun what reading settled and nobody disputes.
- **A gap counts when reproduced**, in either direction: a saved case shows it on both tools. A candidate with no case yet is open, never a gap and never parity.
- **Equivalence by reading says so**, and needs the other side's cases in the graded side's tests, or matching schema and code. The control sample measures how often that is wrong; a surface that fails it is run whole.
- **Feedback moves forward and backward.** The owner's answer shapes the next increment. A miss found in one increment is searched for in every earlier one by script; a changed script reruns what it produced; a cell whose result changes reopens, with a line in `history.jsonl`.
- **Versions move only between increments, by owner decision**, and both projects together.
- **Same ground.** Both tools at pinned stable releases as of one cut date (or both pre-release, stated), on the same machine and inputs, started by one script that takes the tool as its only argument. Each runs on its defaults and on the config its own docs recommend for the job; the mapping between the two configs is saved.
- **The incumbent's surface sets the rows; counted usage sets the weight.** Never the challenger's feature list, never an opinion about what matters. A unit found later enters the inventory with a logged line, and the report says the denominator moved.
- **Parity is a ladder, and a difference is not yet a gap** (`references/fairness.md`). The same name on both sides is only `declared`. Each difference a case finds is classed; only `challenger-defect` is the challenger's fault, and only `harness` costs the adopter nothing.
- **Swap test.** A rule, a threshold or a sentence must read the same with the two names exchanged. A vendor's numbers, from either side, are a claim until reproduced here; a roadmap entry proves a plan, never a feature.
- **Proof level on every cell.** Read (`path:line` at the pinned tag, or URL + access date), specified (spec, version, section), run (command, result, both versions, date). Anything else is HYPOTHESIS. "Run" covers only the inputs that were run. A project's own material is one source about itself and a biased one about its rival.
- **Separate teams** (`references/roles.md`). The static team runs neither tool; nobody validates a cell they mapped; an advocate decides nothing; the judge wrote no cell; the auditor is not the judge; the lead (you) writes no cell.
- **Compute what can be computed.** Keep the matrix as data; derive the ledger, the queue, severities, counts and verdicts with a script (TypeScript on Bun); check every locator with a script plus the writer reading the cited lines.
- **Experiments** run in a temp dir outside every real repository, on clones at the pinned tags, with no real credentials; save scripts, configs, raw outputs and logs in the study before deleting the clones. The charter says what may be downloaded.
- **Outward steps wait for the owner**: filing a defect upstream, publishing the matrix, quoting a maintainer.
- **Set `model` on every spawn** (haiku: mechanical checks; sonnet: inventory, static mapping, scouts, runtime cases; default model: advocates, judge, auditor) and keep within ten agents at a time. Agents get a brief with their role, scope and allowed paths, never your conversation.

## Done when

An increment closes and the study is complete by the criteria in `references/increments.md`. An increment that cannot close ends in a continuation note, never in silence. A study the owner stops early is labelled partial and leads with its coverage.

## State

The study lives in `${TAKASHI_STATE_DIR:-~/.local/state/takashi}/parity/<challenger>-vs-<incumbent>/<cut date>/` unless the charter names another place:

- `CHARTER.md`, `frame.md`, `briefs/<role>.md`
- `matrix.jsonl` (one line per unit and direction: the inventory and the current cells), `history.jsonl` (every change to a cell, append-only)
- `static/` (extraction scripts, their outputs, the usage counts)
- `cases/<unit>/` (input, configs, raw outputs, diff)
- `samples.jsonl` (each seeded draw: seed, pool, cells)
- `objections.md` (the judge's register), `audits/<n>.md`, `increments/<n>.md`, the synthesis

The saved cases are a suite: a later study of newer versions starts a new folder, reruns them first, and analyses again only what changed.

## Report

After the baseline, after each increment and at the end, in the owner's language: both versions and the cut date, the coverage, the verdict per profile in one sentence each (a range until complete), the counts behind it (from the tool), the gaps that block each profile with what would close them, what the challenger does better, the decisions waiting for the owner each with a recommendation, and what the study does not claim.

## References

- `references/intake.md`: the twelve intake questions, the charter template, owner checkpoints.
- `references/fairness.md`: surfaces, the parity ladder, ledger states, weights, static analysis, runtime cases, difference classes, benchmarks, severity, verdicts and their range, the cell record.
- `references/increments.md`: the baseline, the plan, one increment step by step, when the lead goes on without asking, closing criteria and thresholds, the continuation note, feedback backward, new versions, the ledger, the increment report.
- `references/roles.md`: the two teams and the review roles, models, the stake rule, how to read the audit.
