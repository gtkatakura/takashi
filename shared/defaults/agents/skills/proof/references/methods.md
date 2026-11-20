# The menu of proof methods

Mark the surfaces the diff touches, then pick per promise. "Shape" is how the method is declared to the kit: the expectation and the comparison (`--expect` / `--as`).

## Choosing

- Start from the reader: with only the title and description, what would they open, call or run to believe it? That is the method for the top of the report. The technical methods back it up in the appendix.
- A smoke check belongs in every proof of something that runs.
- Public API and architecture carry the most weight: a contract diff and a dependency graph are cheap and say more than many request pairs.
- Offer the choice where the methods trade cost for strength: screenshots, visual diff or video; contract diff or request pairs; an e2e script or a suite comparison.
- A promise that something did not change needs `same` with `--self`, never "it looked the same".
- A tool of the repository that already runs both sides and fails on a wrong verdict is one `holds` promise: run it, write its report into `$PROOF_OUT`.

## Public API (see `api.md`)

| Method | When it fits | Shape | Evidence |
| --- | --- | --- | --- |
| Contract diff | Always when a public surface is touched: OpenAPI, GraphQL, proto, exported types, CLI flags, events | `changed`+`--match`, or `same` / text | Each side's dump, the diff, breaking or additive |
| Request and response pair | Behaviour changes under the same contract | `changed` or `same` / json | Same request on both sides, normalised diff |
| Refusals | The change claims to handle an error, a permission, a validation | `changed`+`--match` / json | The real status and error body |
| Compatibility | A break is suspected, the API is versioned | `holds` | The previous client against the new server |
| Real consumer | The contract is used by a web app or an SDK | `holds` | The real client against the real API and database |
| Documentation examples | Docs or changelog changed | `holds` | The examples, executed |

## Architecture (see `architecture.md`)

| Method | When it fits | Shape | Evidence |
| --- | --- | --- | --- |
| Dependency graph | A boundary moved, a module was extracted, a layer is new | `changed`+`--match`/`--gone` / text | Sorted edges per side, the edges that changed, a diagram |
| Boundary rule | The promise is "X no longer depends on Y" | `changed` / exit 1 → 0 | A rule that fails on base and passes on the change |
| Module surface | Internal refactor, new package | `same` or `changed` / text | The exports of each module, per side |
| Data model | A migration, a new table | `changed`+`--match` / text | Schema dump per side, up and down on a copy |
| Runtime topology | A new process, queue, port or variable | `changed` / text, plus `holds` | Config diff, the trace of one request through the new path |
| Decision record | A choice with rejected options | none | The ADR, attached: it explains why, it proves nothing |

## Tests (see `tests.md`)

| Method | When it fits | Shape | Evidence |
| --- | --- | --- | --- |
| Smoke | Always | `holds` | Starts from clean, health answers, one critical path |
| E2E of the use case | A new feature or flow | `changed` / exit 1 → 0 | Red on base, green on the change |
| Regression test | A bug fix | `changed` / exit 1 → 0 | The new test, run on both sides |
| Suite comparison | The repository has a suite | `same` / text | Failing test names per side: none is new |
| CI on HEAD | There is a pull request | `holds` | CI ran the new tests on the current commit |

## Screens (see `ui.md`)

| Method | When it fits | Shape | Evidence |
| --- | --- | --- | --- |
| Screenshot pair | A static change: layout, copy, a state | `changed` / image | The same screen, size and state on both sides |
| Visual diff | The promise is "only this changed" or "nothing changed": CSS, a design system or library upgrade, a sweep of many screens | `same` / image, `--self` | Difference image and share of pixels |
| E2E with video | Behaviour over time: a flow, a toast, a stream, loading, drag, focus | `changed` / exit, or `holds` | A video and a trace per side |
| E2E with assertions | The flow matters, the timing does not | `changed` / exit | Named steps and their screenshots |
| Size and theme matrix | Layout changed | `changed` or `same` / image | The screen at each size and theme |
| Accessibility | Markup or interaction changed | `same`, or `changed`+`--gone` / text | The scan's violations per side |
| Console and network | Always, inside any screen script | part of the script | Console errors and failed requests |

Skip the visual diff when the change is large and obvious (the difference is the whole screen) or when what moves cannot be masked.

## Everything else (see `other.md`)

| Surface | Method | Shape | Evidence |
| --- | --- | --- | --- |
| Bug | Scripted repro | `changed`+`--gone` / text | The real error on base, gone on the change |
| Performance | Benchmark on both sides | `changed`+`--want`, or `same` / number | Mean and deviation over N runs, threshold declared first |
| Performance | Profile or query plan | attached | Flamegraph, `EXPLAIN ANALYZE`, when the promise is about the cause |
| CLI, script, library | Transcript | `changed` or `same` / text | Command, output, exit code, generated files |
| No visible change | Equivalence | `same`, `--self` | Identical contract, outputs and screens on both sides |
| Data | Migration on a copy | `holds`, `same` / text | Counts and checksums, a second run changes nothing |
| Environment script | Clean install | `holds` | Runs on a clean machine or container; a second run changes nothing |
