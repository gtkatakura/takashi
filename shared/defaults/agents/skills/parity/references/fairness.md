# Comparing fairly

## Surfaces

One inventory agent per surface. Adapt the list to the kind of tool and record what was dropped.

| Surface | Units |
|---|---|
| Behaviour | What the tool does, as its user names it: rules, commands, transforms, API calls |
| Options | Each option of each behaviour unit, and its default |
| Configuration | File formats, discovery, inheritance, overrides, ignore files, inline directives |
| CLI | Flags, exit codes, stdin, output formats |
| Programmatic API | What other programs import or call |
| Extension points | Plugins, custom rules, parsers, hooks, and the most used extensions that rely on them |
| Inputs and platforms | Languages, file types, runtimes, operating systems |
| Integrations | Editors, CI, pre-commit, tools that call the incumbent |
| Output | Diagnostics, positions, fixes, suggestions |
| Performance | Cold run, warm run, memory, behaviour at scale. Runtime only |
| Migration | Converter, guide, what it drops in silence, running both side by side |
| Project health | Licence, governance, release cadence, security response. Facts for both sides, no ladder |

## The parity ladder

| Value | Means | Least proof |
|---|---|---|
| `absent` | No counterpart | Read: where it was searched (docs, source, tracker) |
| `declared` | The challenger says it has it; behaviour not checked | Read |
| `partial` | Exists and behaves differently; every known difference listed | Read for a stated difference, run for a found one |
| `equivalent` | The same result, by the charter's definition | Read: the incumbent's cases present and not skipped in the challenger's tests, or matching schema and code. Run: on the inputs run |
| `superior` | Equivalent, plus a measured thing the incumbent lacks | Run |
| `not-needed` | The need the unit served is met another way (built in, obsolete) | Read, plus one run showing the need is met |
| `non-goal` | The challenger states it will not do it | Read: link and date |
| `unknown` | Not examined | — |

Reverse gaps use the same ladder with the incumbent as the one graded, and go through the same queue and the same cases.

Gap status: `non-goal`, `tracked` (issue link), `in progress` (pull request link), `unknown`, each with the date it was read.

Ledger state of a cell: `untouched`, `baseline` (a value by script only), `read` (settled by reading, no gap), `candidate` (waiting for a case), `confirmed` or `refuted` (a runtime case), `not runnable` (with the reason), `out` (owner decision).

## Weights

A weight is a count, kept with its source.

- **The owner's own configs**: the strongest evidence for an adopter. "Uses 212 units: 198 equivalent, 9 partial, 5 absent."
- **The incumbent's recommended presets**: what a default user gets.
- **A seeded sample of public repositories** from a stated population (dependents, a registry's top N): how many use the unit.
- **Registry downloads** of extensions.

Weight values: `core` (in a recommended preset, or used by most of the sample), `common`, `niche`, `unknown`. The thresholds go in the charter before counting.

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
| The incumbent's test cases against the challenger's | Ported, changed, skipped, dropped. A skipped or dropped case is a gap candidate with its input ready |
| Trackers and docs | Stated non-goals, tracked gaps, documented divergences |

Agents read what a diff cannot settle: the code of a unit whose cases were changed, an option that exists on both sides with another meaning. A finding names the lines on both sides.

Static analysis is weak where behaviour is in no schema and no test: output wording, positions, ordering, config discovery, interplay between units. Those surfaces go to runtime whole, and the increment plan says so.

## A runtime case

1. **One script, both tools.** The tool is the only argument; inputs, working directory, environment and locale are the same.
2. **A minimal input** that should show the candidate gap, plus the config on each side. Where the incumbent has fixtures for the unit, a script turns them into cases in bulk; an agent writes an input only where there is none.
3. **Normalise** both outputs into one schema (file, position, unit, severity, fix) and diff that. The normaliser lives in the study. Self check: the incumbent run twice must give no difference.
4. **Verdict**: `confirmed` (the incumbent does it, the challenger does not, or differently), `refuted` (the same result), `not runnable` (why).
5. **A confirmed gap** then gets its class, an impact count (how often the unit fires on the profiles' code at pinned commits) and its workaround tried on the same case.
6. **Record**: commands, both versions, both configs, raw outputs, the diff.

The control sample (cells that reading called equivalent, drawn by a seeded script) runs through the same steps. A disagreement reopens the cell and sends the static team back to find what the reading missed. Sizes and thresholds: `references/increments.md`.

Conformance, where a harness allows: run the incumbent's test suite against the challenger. Report passed, failed and not runnable. Not runnable is not failed.

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

Severity of a gap, per profile:

| Severity | Means |
|---|---|
| `blocker` | The profile uses the unit and there is no workaround, or a floor breaks |
| `costly` | A workaround exists: name it and what it costs (a config change, a second tool, lost coverage) |
| `cosmetic` | The output differs and nothing the profile relies on breaks |
| `none` | The profile does not use the unit |

Verdict per profile, derived by script from the matrix:

| Verdict | When |
|---|---|
| `drop-in` | No blocker, no costly gap, floors hold |
| `drop-in with changes` | No blocker; the costly gaps and their changes are listed |
| `side by side` | The challenger covers the listed part; the incumbent stays for the listed rest |
| `not yet` | Blockers, each with what would close it |

Until the ledger is complete a verdict is a range, derived the same way twice: **at best** counts confirmed gaps only; **at worst** counts every open candidate on a unit the profile uses as a confirmed blocker. The units of the profile still `untouched` or at `baseline` are a count beside it. The range narrows with each increment and is final when both ends are the same.

## The cell record

One JSON line per unit and direction in `matrix.jsonl`:

`id`, `surface`, `unit`, `increment`, `direction` (gap or reverse), `weight` and its count and source, `value`, `proof` (read, specified, run, hypothesis), `evidence` (locators or case id), `state` (the ledger state), `differences` (each with its class), `impact` count, `status` and link, `severity` per profile, `workaround` and its cost, both versions, `date`, `mapped_by`, `validated_by`, `audited`.

`matrix.jsonl` holds the current cells. Every change to one appends a line to `history.jsonl`: cell, increment, from, to, why, who.
