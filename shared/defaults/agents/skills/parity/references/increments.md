# Increments

The whole surface is known from the start; depth arrives in slices. Each slice ends in a report the owner can act on. States, values and verdicts are defined in `references/fairness.md`.

## The baseline (increment 0)

Scripts only: no agent reads a unit, neither tool runs.

1. The usage scout counts usage, gives each unit a weight, marks which profiles use it, and adds to the inventory any unit a profile's config uses that the inventory missed.
2. The extraction scripts run over the whole surface of both projects at the pinned tags and diff the two sides.
3. Each unit a script reached gets a provisional value: `absent` when no counterpart was found by name, `declared` when one was. Its state is `baseline`. The rest stay `untouched` until their increment.
4. The inventory is compared with the challenger's own compatibility table. A unit only the table has enters the inventory; where the table and the script disagree, the unit heads its increment's queue.
5. The same scripts list the challenger's units with no counterpart on the incumbent's side: the reverse units.
6. The signal scout collects stated non-goals, tracked gaps and migration reports from both trackers, as gap statuses and as places to look.

The baseline report is the first increment report: the ledger, a verdict range per profile, the largest groups of `absent` units by weight, and the plan. It reaches the owner before any slice starts.

## The plan

- **Pilot first**: about a dozen `core` units of one surface. It is judged on the method as much as on its cells: did the extraction scripts, the one script and the normaliser hold, what a unit costs, how many cases fit one agent. Its report sizes what follows.
- **Order**: `core`, then `common`, then `niche`, then `unknown`, one surface at a time. Units a profile uses come first within each. Reverse units go with their surface, after its gap units.
- **Every surface in focus has an increment**, so no unit stays `untouched`.
- **Size**: an increment closes within one session and its report reads in two minutes. Each one states the share of counted usage it adds.
- **Runtime-whole surfaces** (output wording, positions, config discovery, interplay between units): the slice has no static mapper, every unit gets a case, and the reproducer writes the value from the case. Nothing was mapped, so nothing is self-validated; the auditor's rerun is the check. Performance is an increment of its own.
- **Released in batches.** The charter says how many increments the owner releases per checkpoint.

Inside a released batch the lead goes on to the next increment without waiting, unless one of these holds. Then it stops and asks:

- a confirmed gap breaks a floor, or moves the best end of a profile's range;
- the control sample or the audit crossed its threshold;
- the pilot's cost puts the plan outside the budget;
- an owner answer is needed to class a difference or to set a weight.

## One increment

1. **Static team** maps the slice: each unit's counterpart, value, differences with lines on both sides, gap status. Every cell not settled as `equivalent` is a `candidate`. The queue is derived from the matrix by script.
2. **Runtime team** works the queue: cases deferred by the last increment first, then candidates by weight, then the control sample. A cell rises to "run" only when a saved case executed the inputs its value rests on. The corpus runner then counts impact, tries workarounds and proposes each severity.
3. **Static team repairs.** For each refuted candidate and each control disagreement, the mapper rereads and names what the reading missed. A script looks for the same miss in this and every earlier increment, and those cells reopen.
4. **Mechanical checker** confirms every new locator, link, version and date.
5. **Advocates object**, two passes at most. In the first neither reads the other; in the second each may rebut with evidence. An objection has a target cell, a severity (BLOCKING, IMPORTANT, MINOR), a claim and evidence. "The comparison is unfair" names the rule it breaks.
6. **Judge** decides each objection (accept, reject, needs a case) and settles disputed classes and severities. A case it names runs now when it fits the budget, else it is deferred.
7. **Auditor** samples three pools (changed in this increment, never audited, drawn from earlier increments with a recorded seed), fixes or downgrades what the evidence does not support, and reports the errors overall, per pool, per team and per side favoured, each with its cause. In doubt, it downgrades.
8. **Lead** checks that no real repository was touched, runs the study's tools, writes the increment report, and puts each cause the audit named into the role briefs under a dated heading.

Whoever writes before a later agent runs records where that agent's result will go, never its outcome.

## An increment closes when

- every unit of the slice has a value and a proof level;
- every candidate of the slice, in either direction, has a case result or is `not runnable` with the reason, except those deferred;
- every confirmed difference has a class, and every confirmed gap a severity per profile;
- every control disagreement is repaired and traced (step 3), and every audit error is fixed with its cause recorded;
- no BLOCKING objection is open, except those deferred.

**Deferred** means: the judge or the budget moved a case to the head of the next queue. The report lists each deferral with its reason, and the increment closes "with deferrals". An objection the judge decided and an advocate still disputes after two increments is a divergence, and goes to the owner.

**Thresholds** are cumulative, never per increment, and need two events so that one cannot trip them:

- **Control**, per surface. Each increment draws ten of the slice's `read` cells, or all when there are fewer. A surface with two or more disagreements, and 5% or more of the cells drawn so far, goes to runtime whole: its `read` cells go back to `candidate`.
- **Audit**, over the study. Each increment draws at least ten cells, or all when there are fewer. Two or more errors, and 5% or more of the cells drawn so far, stop the next increment until the cause is found.
- **Lean.** Three or more errors, three in four of them favouring the same side, stop the next increment the same way.

## The study is complete when

- no unit is open (`untouched`, `baseline` or `candidate`), in either direction;
- every increment closed and nothing is deferred;
- so both ends of every profile's range are the same;
- the auditor has drawn at least thirty cells, under the audit and lean thresholds;
- the final audit is answered.

## The continuation note

When an increment cannot close, or the session ends first, `increments/<n>-continue.md` says: what is done, what is open and why, the next action and who takes it, the state of each closing criterion, and where the files are. A new session starts from it.

## Feedback backward

| Event | What reruns | What reopens |
|---|---|---|
| A reading was wrong (refuted candidate, control disagreement, audit error) | A script searching for the same miss in every increment | The cells it finds |
| An extraction script changed | The extraction and its diff, over the whole surface | Cells whose extraction output changed |
| The one script or the normaliser changed | Every saved case | Cells whose result changed |
| The owner corrected a weight, a profile, a floor or the definition of equivalent; or usage was counted again | The derivation scripts, after a dated charter amendment | Severities and verdicts; cells the new definition judges differently |
| A unit entered the inventory | The baseline scripts for that unit | Nothing; the ledger's denominator moves, and the report says so |
| The judge accepted an objection | The case it names | The target cell |

Every change to a cell is one line in `history.jsonl`: cell, increment, from, to, why, who. The report's "what changed in earlier increments" is derived from it.

## New versions during the study

A release of either project does not move the study. At an increment boundary the owner may re-pin:

1. Record the new versions and cut date in the charter, dated.
2. Rerun the extraction scripts and every saved case on the new tags.
3. Reopen the cells whose extraction or case result changed; leave the rest, marked with the versions they were last checked on.
4. Report what the release closed and what it opened, as an increment of its own.

Both projects move together: never a new challenger against the old incumbent.

## The ledger

Derived by script from `matrix.jsonl`, never typed. One table for gap cells, one for reverse cells.

| State | Units | Share of counted usage |
|---|---|---|
| Inventoried | | 100% |
| `untouched` | | |
| `baseline` | | |
| `candidate` | | |
| `read` (equivalent by reading) | | |
| `run`, gap confirmed | | |
| `run`, no gap (refuted) | | |
| `not runnable` | | |
| `out` | | |

Units with weight `unknown` are in the units column only.

## The increment report

`increments/<n>.md`:

1. Versions, cut date, what this slice covered.
2. The ledger, before and after; whether the denominator moved.
3. Verdict per profile: at best, at worst, and its open units by state and weight.
4. New confirmed gaps, ranked by weight and severity, each with its case, class, workaround and gap status.
5. What the challenger does better, confirmed in this slice.
6. What changed in earlier increments, and why (from `history.jsonl`).
7. Method: refuted rate, control disagreements, audit errors and their lean, deferrals, spend.
8. The next slice, and the questions for the owner, each with a recommendation.
