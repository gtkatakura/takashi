# Intake and charter

## Asking

- Read what exists first; do not ask what it already answers.
- Batches of up to four questions, each with a recommended answer and what the choice changes.
- Record each answer as given, with the date. An answer that looks unsafe or contradictory is questioned once, with the reason, then recorded as decided.

## The twelve questions

| # | Question | Without it |
|---|---|---|
| 1 | Which decision does this unlock (adopt, migrate these repositories, order the challenger's roadmap, publish a comparison), and what is not decided now? | A matrix nobody acts on |
| 2 | What is your stake in either project (maintainer, contributor, user, vendor, none)? | An unrecorded bias, and the wrong advocate on the weaker model |
| 3 | Which claim is under test, in the challenger's own words, with its URL? | The study tests a claim nobody made |
| 4 | Which adopter profiles get a verdict: your own repositories, or named kinds of project? | One yes or no that fits nobody |
| 5 | Which versions, as of which cut date, stable or pre-release? | A nightly is compared with a two-year-old stable |
| 6 | Which surfaces are in focus, mapped for later, out? Which extensions (plugins) count as the incumbent's surface? | Depth is spent on what no profile uses; the plugins every real config uses are left out |
| 7 | What counts as equivalent: identical output, the same findings whatever the wording and order, the same exit code? | Every reworded message is a gap, or none is |
| 8 | Which floors must hold for any verdict better than "not yet" (no lost error-level finding, same exit code in CI)? | A blocker is traded for speed |
| 9 | Which corpus may be used and run: your repositories, public ones, the incumbent's own tests? What may be downloaded? | A gap is stated from reading and never reproduced |
| 10 | Which performance matters (cold CI run, warm editor, memory), on which machine? | A benchmark of the wrong thing |
| 11 | Which budget: size of an increment, increments released per checkpoint, agents at a time, models? May it stop before the whole surface is covered? | The loop stops when the session ends, with nothing usable |
| 12 | Which form does the result take, where does it live, and is it public? What is already decided and not reopened? | A page nobody asked for; a public text with private names in it |

## Charter template

```markdown
# Charter: <challenger> as a replacement for <incumbent>

Released by the owner on <date>. Changed only by the owner; each change is dated, and the cells it touches are derived again by script.

1. Decision — what this unlocks; what it does not decide.
2. Owner's stake — in either project; which advocate and audits go to another vendor's model because of it.
3. Claim under test — the challenger's words, URL, access date; how a user would read it.
4. Profiles — | Id | Who | Repositories or configs that stand for it | (one verdict each)
5. Versions — | Project | Version | Released | Channel | Commit | ; the cut date.
6. Surfaces — | In focus | Mapped for later | Out | ; the boundary: which extensions count as the incumbent's surface.
7. Equivalence — what "the same result" means per surface, and what the normaliser may drop.
8. Floors — what must hold for any verdict better than "not yet".
9. Premises — | Id | Premise | Class (frame, current state, usage, method) | Declared by | Evidence or HYPOTHESIS | Overturned by |
10. Proof — what reading may settle alone, per surface; which surfaces go to runtime whole; control sample size and seed; allowed runs and downloads; what this machine cannot run.
11. Corpus and weights — inputs for runtime cases at pinned commits; where usage is counted, sample size and seed; the thresholds for core, common and niche.
12. Teams — | Role | Scope | Model | (static analysis team, runtime validation team, review)
13. Increments — | # | Slice (surface, weight) | Units | Share of counted usage | ; the pilot first. Budget: increments released per checkpoint, agents at a time.
14. Complete when — the standard criteria plus any the study adds.
15. Deliverables — files, page, where they live, public or private.
16. Owner answers — | Date | Question | Answer, as given |
```

Section 13 is filled at the baseline (step 5) and released then. A re-pin of the versions is a dated change to section 5.

## Owner checkpoints

| When | Bring | Owner decides |
|---|---|---|
| Charter | The charter and the premises you are least sure of | Release or change |
| Frame attack | `frame.md`, each BLOCKING objection with a recommendation | Accept or reject each; release the charter again if it changed |
| After the inventory (a note, no wait) | Units counted per surface, what was hard to list | Nothing; may correct the boundary |
| After the baseline | The baseline report: first ledger, verdict range per profile, units found in only one list, the increment plan with the pilot | The order; what is out |
| After the pilot | Its report; what a unit costs; what the scripts could not settle | The size of the next increments |
| End of each released batch, or a stop condition inside it | The increment reports: ledger, verdict ranges, new gaps, what changed before, the next slice | Go on, reorder, widen, drop, correct a weight or a definition, or re-pin the versions |
| A divergence (an objection the judge decided and an advocate still disputes after two increments) | Each advocate's position and evidence, the judge's decision | The divergence |
| Complete, or stopped | Synthesis with its coverage, verdict per profile, decisions with recommendations, defects found, what is not claimed | The decisions; what goes upstream or public |
