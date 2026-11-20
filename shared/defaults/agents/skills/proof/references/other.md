# Performance, command lines, refactors, data, environments

## Performance

```sh
proof claim faster-list --text "Listing 10,000 items is faster" --method benchmark --expect changed --as number \
  --want lower --assert "at least 5% less time, beyond run-to-run noise"
proof pair faster-list --runs 10 --metric time -- 'sh "$PROOF_RUN/scripts/list-10k.sh"'
```

- `--metric time` measures the command's wall time. `--metric stdout` takes the last number the command prints, for a tool's own measure (requests per second, a p95). Say which one: without it the kit takes a printed number when every run has one.
- The threshold (default 5%, `--threshold`) and the direction (`--want lower|higher`) are declared before the run. A change counts only when it passes the threshold and exceeds the two sides' deviations together.
- "Not slower" is `--expect same`: the difference stays within the threshold.
- Warm up inside the script, keep the data the same, run on an idle machine, and name the machine in a note. The sides run one after the other, never together.
- When the promise is about the cause (a query, a hot loop), write a profile or an `EXPLAIN ANALYZE` per side into `$PROOF_OUT`.
- A proof run is one machine on one day. Say so, and `block` a promise about production load.

## Command lines, scripts, libraries

No screen: the transcript is the evidence. The command, its output and its exit code are captured per side. End the command with `2>&1` when messages go to stderr, and copy generated files into `$PROOF_OUT`. For a library, a small example program in `$PROOF_RUN/scripts` that calls the public functions and prints the results is the request pair of that API.

## No visible change

A refactor or a rename promises that nothing a consumer sees moved. "No visible change" is a claim like any other: prove it with `--expect same` and `--self` on what a consumer can see, and name in the report which surfaces were compared.

- The contract dump (`api.md`) and the module surface (`architecture.md`).
- The output of a script that exercises the main paths.
- The screens that could have moved (`ui.md`, visual diff).
- The names of the failing tests (`tests.md`, suite comparison).

What was not compared was not proven the same.

## Data migrations

On a copy or a fixture, never on real data.

- Counts and checksums per table before and after, printed by one script: `same` where the data must not move, `changed` with `--match` where it must.
- A second run of the migration changes nothing: a `holds` promise whose script runs it twice and compares the dumps.
- The down migration brings the schema back: `holds`.
- The application starts and passes the smoke check on the migrated copy.

## Environment and setup scripts

For a script that changes a machine (an installer, a dotfiles step):

- It runs to the end on a clean machine or container: `holds`. Name the image.
- A second run changes nothing: `holds`, comparing a dump of what it manages (files, links, packages) after the first and the second run.
- What it changed against the previous version: the same dump from a container set up with the base and one with the change, compared as text.

Never prove an installer on the owner's own machine.
