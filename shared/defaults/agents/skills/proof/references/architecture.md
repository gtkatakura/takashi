# Proving an architecture change

An architecture promise is about shape: what depends on what, what each module exposes, how data is laid out, which processes exist and how a request travels. The reader cannot see shape in a diff, so each method turns it into something that can be dumped on both sides and compared. Tool flags are starting points: check `--help` of the installed version.

## Dependency graph

Each side prints its edges, one per line, sorted. Any tool that lists imports works:

```sh
# JS/TS with dependency-cruiser; madge --json or knip work too
bunx depcruise src --no-config --output-type json \
  | jq -r '.modules[] | .source as $s | .dependencies[] | "\($s) -> \(.resolved)"' | sort -u
# Go
go list -f '{{ $p := .ImportPath }}{{ range .Imports }}{{ $p }} -> {{ . }}{{ "\n" }}{{ end }}' ./... | sort -u
```

```sh
proof claim graph --text "The web app no longer imports the core's internals" --surface architecture \
  --method "dependency graph" --expect changed --as text \
  --assert "no edge from apps/web into packages/core/internal" --gone 'apps/web/.* -> packages/core/internal'
proof pair graph --self -- 'sh "$PROOF_RUN/scripts/edges.sh"'
```

- Collapse to the level the promise speaks at (package or folder, not file): a file-level graph of a real project buries the one edge that matters.
- For the reader, add a picture: the tool's Mermaid or dot output of the collapsed graph, written per side into `$PROOF_OUT`. GitHub renders Mermaid in a pull request.
- The dumper lives in `$PROOF_RUN/scripts`, so the base is measured with the same tool and options.

## Boundary rule

When the promise is a rule ("X does not depend on Y", "only the adapter talks to the database"), make the rule executable and show it red on base and green on the change:

```sh
proof claim boundary --text "Only packages/db talks to Postgres" --method "boundary rule" --expect changed --as exit \
  --assert "the rule fails on base and passes on the change" --exit-base 1 --exit-change 0
proof pair boundary -- 'sh "$PROOF_RUN/scripts/edges.sh" | grep -v "^packages/db/" | grep -q " -> .*node_modules/pg" && exit 1 || exit 0'
```

Offer to keep the rule as a permanent guard: a rule that only ran once will not hold.

## Module surface

What each module exports is its contract with the rest of the code. Dump it per side (declaration files, `go doc -all`, the package's entry points) and compare as text: `same` for a refactor that promises not to touch the surface, `changed` with `--match` for a new entry point.

## Data model

- **Schema**: each side migrates an empty throwaway database and dumps it (`pg_dump --schema-only --no-owner`, `sqlite3 .schema`). `changed` with `--match` on the new table or column; `--ignore` for version comments.
- **Migration**: on a copy or a fixture, never on real data. Row counts and checksums before and after, the down migration, and a second run that changes nothing (see `other.md`).

## Runtime topology

- **Configuration**: the list of services, ports and variables per side (`docker compose config --services`, the variables an example env file names), compared as text.
- **One request through the new path**: a `holds` promise whose script makes the request and then finds its request id in the logs of the components it must cross, with `--match` on the new component's line.

## Decision record

An ADR says why and which options were rejected. Attach it or link it in a note; it explains the change and proves nothing about it.
