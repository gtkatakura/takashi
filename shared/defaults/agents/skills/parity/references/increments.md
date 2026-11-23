# Increments

The whole surface is known from the start; depth arrives in slices. Each slice ends in a report the owner can act on.

## The baseline (increment 0)

Scripts only: no agent reads a unit, neither tool runs.

1. The usage scout counts usage and gives each unit a weight (`references/fairness.md`).
2. The extraction scripts (`references/fairness.md`, static analysis) run over the whole surface of both projects at the pinned tags and diff the two sides.
3. Each inventoried unit gets a first value: `absent` when no counterpart was found by name, `declared` when one was. Units on surfaces with nothing to extract stay `untouched`.
4. The inventory is compared with the challenger's own compatibility table. A unit present in only one of them is a finding; where the table and the script disagree, the unit heads its increment's queue.
5. The same scripts list the challenger's units with no counterpart on the incumbent's side: the reverse candidates.

The baseline report is the first increment report: the ledger, a verdict range per profile, the largest groups of `absent` units by weight, and the plan. It reaches the owner before any slice starts.

## The plan

- **Pilot first**: about a dozen `core` units of one surface. It is judged on the method as much as on its cells: did the extraction scripts, the one script and the normaliser hold, what a unit costs, how many cases fit one agent. Its report sizes what follows.
- **Order**: `core`, then `common`, then `niche`, then `unknown`, one surface at a time. For an adopter, the units their own configs use come first.
- **Size**: an increment closes within one session and its report reads in two minutes. Each one states the share of counted usage it adds.
- **Runtime-whole surfaces**: where behaviour is in no schema and no test (output wording, positions, config discovery, interplay between units), the slice skips the static mapper and every unit gets a case. Performance is an increment of its own.
- **Released in batches.** The charter says how many increments the owner releases per checkpoint.

Inside a released batch the lead goes on to the next increment without waiting, unless one of these holds. Then it stops and asks:

- a confirmed gap breaks a floor, or moves a profile's best case;
- the control sample or the audit failed for a surface;
- the pilot's cost puts the plan outside the budget;
- an owner answer is needed to class a difference or to set a weight.

## One increment

1. **Static team** maps the slice. Its output is the cells and their evidence; the gap queue is derived from the matrix by script, ordered by weight, with reverse candidates in the same queue.
2. **Runtime team** works the queue: cases left open by the last increment first, then gap candidates, then the control sample. Where the incumbent has fixtures for a unit, a script turns them into cases; an agent writes a case only where there is none. A cell rises to "run" only when a saved case executed the inputs its value rests on.
3. **Static team repairs.** For each refuted candidate and each control disagreement, the mapper rereads and names what the reading missed. A script looks for the same miss in this and every earlier increment, and those cells reopen.
4. **Advocates object.** In the first pass neither reads the other; in the second each may rebut with evidence. An objection has a target cell, a severity (BLOCKING, IMPORTANT, MINOR), a claim and evidence. "The comparison is unfair" names the rule it breaks.
5. **Judge** decides each objection (accept, reject, needs a case) and settles disputed classes. Cases it names run now when they fit the budget, else head the next queue.
6. **Auditor** samples three pools (changed in this increment, never audited, drawn from earlier increments with a recorded seed) and reports the error rate overall, per pool, per team and per side favoured. In doubt, it downgrades.
7. **Lead** checks that no real repository was touched, runs the study's tools, writes the increment report, and amends role briefs under a dated heading.

Whoever writes before a later agent runs records where that agent's result will go, never its outcome.

## An increment closes when

- every unit of the slice has a value and a proof level;
- every candidate of the slice, in either direction, is `confirmed`, `refuted`, or `not runnable` with the reason;
- every confirmed difference has a class;
- every control disagreement and every audit error found in it is fixed and traced to its cause (step 3);
- no BLOCKING objection is open, or the judge put it at the head of the next queue.

Rates are cumulative, never per increment (ten cells cannot show 5%):

- **Control**, per surface: at least ten cells per increment that has cells settled by reading. From twenty cells on, a surface with 5% or more disagreements goes to runtime whole, and its cells settled by reading reopen.
- **Audit**, over the study: from thirty cells on, an error rate of 5% or more, or errors leaning to one side, stops the next increment until the cause is found.

## The study is complete when

- no unit is `untouched` or at its baseline value, except those the owner put out;
- every increment closed, and no queue is left;
- the best case and the worst case of every profile's verdict are the same;
- the auditor has sampled at least thirty cells by a seeded script, with an error rate under 5% and no lean;
- the final audit is answered.

## Feedback backward

| Event | What reruns | What reopens |
|---|---|---|
| A reading was wrong (refuted candidate, control disagreement, audit error) | A script searching for the same miss in every increment | The cells it finds |
| The one script or the normaliser changed | Every saved case | Cells whose result changed |
| The owner corrected a weight, a profile or the definition of equivalent | The derivation scripts, after a dated charter amendment | Severities and verdicts; cells the new definition judges differently |
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

Derived by script from `matrix.jsonl`, never typed. One table for gaps, one for reverse gaps.

| State | Units | Share of counted usage |
|---|---|---|
| Inventoried | | 100% |
| Untouched (nothing to extract yet) | | |
| Baseline only (`absent` or `declared` by script) | | |
| Settled by reading, no gap | | |
| Candidate waiting for a case | | |
| Confirmed gap | | |
| Refuted (`equivalent` at "run") | | |
| Not runnable | | |
| Out by owner decision | | |

## The increment report

`increments/<n>.md`:

1. Versions, cut date, what this slice covered.
2. The ledger, before and after.
3. Verdict per profile: at best, at worst, and the units of that profile not yet read.
4. New confirmed gaps, ranked by weight and severity, each with its case, class, workaround and status.
5. What the challenger does better, confirmed in this slice.
6. What changed in earlier increments, and why (from `history.jsonl`).
7. Method: refuted rate, control disagreements, audit error rate and its lean, spend.
8. The next slice, and the questions for the owner, each with a recommendation.
