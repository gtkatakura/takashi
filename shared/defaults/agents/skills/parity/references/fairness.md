# Comparing fairly

Two words used throughout. In a **gap** cell the challenger is the **graded side** and the incumbent the **reference side**. In a **reverse** cell (something the challenger offers that the incumbent lacks) it is the other way round. Every rule below is written for the graded side and holds in both directions.

## Surfaces

One inventory agent per surface. Adapt the list to the kind of tool and record what was dropped.

| Surface | Units |
|---|---|
| Behaviour | What the tool does, as its user names it: rules, commands, transforms, API calls |
| Options | Each option of each behaviour unit, and its default |
| Configuration | File formats, discovery, inheritance, overrides, ignore files, inline directives |
| CLI | Flags, exit codes, stdin, output formats |
| Programmatic API | What other programs import or call |
| Extension points | Plugins, custom rules, parsers, hooks |
| Inputs and platforms | Languages, file types, runtimes, operating systems |
| Integrations | Editors, CI, pre-commit, tools that call the incumbent |
| Output | Diagnostics, positions, fixes, suggestions |
| Performance | Cold run, warm run, memory, behaviour at scale. Runtime only |
| Migration | Converter, guide, what it drops in silence, running both side by side. Listed from both sides, not blind |

**Boundary.** The charter says which extensions count as the incumbent's surface (for a linter, which plugins): those the profiles' configs use are in by default. An extension that is in has its own behaviour and options units.

**Project health** (licence, governance, release cadence, security response) is a table of facts for both sides in the synthesis. It has no units in the ledger.

## The parity ladder

| Value | Means | Least proof |
|---|---|---|
| `absent` | No counterpart | Read: where it was searched (docs, source, tracker) |
| `declared` | A counterpart exists by name; behaviour not checked | The name match, or the graded side's own claim |
| `partial` | Exists and behaves differently; every known difference listed | Read for a stated difference, run for a found one |
| `equivalent` | The same result, by the charter's definition | Read: the reference side's cases present and not skipped in the graded side's tests at the pinned tag, or matching schema and code. Run: on the inputs run |
| `superior` | Equivalent, plus a measured thing the reference side lacks | Run |
| `not-needed` | The need the unit served is met another way (built in, obsolete) | Read, plus one run showing the need is met |
| `unknown` | Not examined | — |

Why a gap stands (`absent` or `partial`) is its **gap status**: `non-goal` (the graded side states it will not do it: link, date), `tracked` (issue link), `in progress` (pull request link), `no statement`. Each with the date it was read.

## Ledger states

How far the examination of a cell got. Derived by script from the cell, never typed.

| State | Means | Open |
|---|---|---|
| `untouched` | No script reached it yet | yes |
| `baseline` | A provisional value by script (`absent` or `declared` from a name match) | yes |
| `candidate` | Mapped by the static team, not settled as `equivalent`; waiting for a case | yes |
| `read` | Reading settled it as `equivalent` | no |
| `run` | A case settled it. The case result is `confirmed` (the gap is real) or `refuted` (there is none) | no |
| `not runnable` | No case could be run; the reason is recorded | no |
| `out` | Left out by owner decision | no |

A baseline value is a guess: it enters no verdict as parity and none as a gap. A `not runnable` cell is settled, and every verdict it touches names it.

## Weights

A weight is a count, kept with its source.

- **The owner's own configs**: the strongest evidence for an adopter. "Uses 212 units: 198 equivalent, 9 partial, 5 absent."
- **The incumbent's recommended presets**: what a default user gets.
- **A seeded sample of public repositories** from a stated population (dependents, a registry's top N): how many use the unit.
- **Registry downloads** of extensions.

Weight values: `core` (in a recommended preset, or used by most of the sample), `common`, `niche`, `unknown` (no count). The thresholds go in the charter before counting. Reverse units are counted the same way where a count exists, else `unknown`.

**A unit's usage** is the count behind its weight. **A state's share of counted usage** is the usage of its units over the usage of all counted units. Units with weight `unknown` are left out of the share and reported in units.

**A profile uses a unit** when the configs that stand for it in the charter enable it or leave it on by default; for surfaces with no config (CLI, API, integrations), when a script search finds the profile's repositories calling it (scripts, CI files, imports).

## Static analysis

Both repositories cloned at the pinned tags; neither tool runs, only the extraction scripts do. The baseline runs them over the whole surface; a slice's mapper starts from their output.

Extract by script, then diff by script:

| From both sides | Shows |
|---|---|
| The registry of behaviour units (rule list, command table) | Units with no counterpart; names that differ |
| Option schemas and defaults | Options missing, extra, or with another default |
| CLI flag definitions | Flags missing or with another meaning |
| Config schema | Keys not read, read differently, or ignored in silence |
| Exported API | Symbols missing or with another signature |
| The reference side's test cases against the graded side's | Ported, changed, skipped, dropped. A skipped or dropped case is a candidate with its input ready |
| Trackers and docs | Stated non-goals, tracked gaps, documented divergences |

Agents read what a diff cannot settle: the code of a unit whose cases were changed, an option that exists on both sides with another meaning. A finding names the lines on both sides.

Static analysis is weak where behaviour is in no schema and no test: output wording, positions, ordering, config discovery, interplay between units. Those surfaces go to runtime whole, and the increment plan says so.

## A runtime case

1. **One script, both tools.** The tool is the only argument; inputs, working directory, environment and locale are the same.
2. **A minimal input** that should show the candidate gap, plus the config on each side. Where the reference side has fixtures for the unit, a script turns them into cases in bulk; an agent writes an input only where there is none.
3. **Normalise** both outputs into one schema (file, position, unit, severity, fix) and diff that. The normaliser lives in the study. Self check: the reference tool run twice must give no difference.
4. **Result**: `confirmed` (the graded tool does not give the reference tool's result), `refuted` (it does), or the cell becomes `not runnable` (why).
5. **A confirmed gap** then gets the class of each difference, an impact count (how often the unit fires on the profiles' code at pinned commits) and its workaround tried on the same case.
6. **Record**: commands, both versions, both configs, raw outputs, the diff.

The control sample (cells in state `read`, drawn by a seeded script) runs through the same steps. A disagreement reopens the cell and sends the static team back to find what the reading missed. Sizes and thresholds: `references/increments.md`.

Conformance, where a harness allows: run the reference side's test suite against the graded side. Report passed, failed and not runnable. Not runnable is not failed.

Never adjust a config until the outputs match without saving the adjustment: it is a migration cost, and a finding.

## Difference classes

| Class | When | Whose |
|---|---|---|
| `challenger-defect` | The incumbent's behaviour is documented or specified and the challenger departs from it | Challenger |
| `incumbent-defect` | The challenger follows the docs or spec and the incumbent does not, or the incumbent's tracker accepts the bug | Incumbent |
| `intended` | The challenger documents the divergence | Neither |
| `unspecified` | Nothing says which is right | Neither |
| `harness` | The script or normaliser caused it | The study: fix and rerun, not a finding |

## Benchmarks

- Same machine, nothing else running; hardware, OS and both versions recorded.
- **Equal work**: the units both implement, with matching options. Each tool's own defaults are a second, separately labelled measurement. Fewer checks done is not speed.
- Cold and warm, cache on and off, single thread and default threads, each stated.
- At least ten runs; report median and spread; keep the raw timings.
- The corpus is the profiles' code, not a vendor's showcase repository.
- A published number from either project is a claim: reproduce it or label it.

## Severity and verdicts

A workaround has a kind: `config` (a change of configuration), `other tool`, `keep incumbent` (the incumbent keeps running beside the challenger for this unit), `accept` (live without it). And a cost, in words.

Severity of a confirmed gap, per profile:

| Severity | Means | Set by |
|---|---|---|
| `none` | The profile does not use the unit | Script |
| `blocker` | The profile uses the unit and no workaround worked on the case, or a floor breaks | Corpus runner proposes |
| `costly` | A workaround worked: its kind and cost | Corpus runner proposes |
| `cosmetic` | The output differs and nothing the profile relies on breaks | Corpus runner proposes |

A proposed severity is disputed like any cell: an advocate objects, the judge decides.

Verdict per profile, derived by script from the confirmed gaps on the units it uses. The first row that holds:

| Verdict | When |
|---|---|
| `not yet` | A blocker. Each is listed with what would close it |
| `side by side` | No blocker; at least one gap's workaround is `keep incumbent`. The units left to the incumbent are listed |
| `drop-in with changes` | No blocker, nothing kept on the incumbent; the costly gaps and their changes are listed |
| `drop-in` | No blocker and no costly gap; the floors hold |

**The range.** While a unit the profile uses is open, the script derives the verdict twice: **at best** takes every open unit as no gap; **at worst** takes every open unit as a blocker. Beside the range go the profile's open units, counted by state and by weight. At the baseline the range is usually the widest there is, and those counts are what the owner reads; each increment narrows it. With no open unit left both ends are the same, and that is the verdict. The `not runnable` units the profile uses are named with it: the verdict holds except for what could not be shown either way.

## The cell record

One JSON line per unit and direction in `matrix.jsonl`:

`id`, `surface`, `unit`, `increment`, `direction` (gap or reverse), `weight` with its count and source, `used_by` (profiles), `value`, `proof` (read, specified, run, hypothesis), `evidence` (locators or case id), `case` (confirmed, refuted, not runnable, or none yet), `differences` (each with its class), `impact` count, `gap_status` and link, `severity` per profile, `workaround` (kind and cost), `out` (owner decision, with the date), both versions, `date`, `mapped_by`, `validated_by`, `audited`.

The ledger state is derived from `value`, `proof`, `mapped_by`, `case` and `out`.
