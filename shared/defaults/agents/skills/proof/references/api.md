# Proving a public API

The public API is what a client outside the code can depend on: routes and their bodies, GraphQL or proto schemas, exported types of a library, flags and output of a CLI, events and webhooks. Tool flags below are starting points: check `--help` of the installed version.

## Contract diff

Each side prints its contract; the kit shows what moved.

```sh
proof claim contract --text "POST /items accepts and returns a due date" --surface "public API" \
  --method "contract diff" --expect changed --as text \
  --assert "dueDate appears in the item schema, nothing is removed" --match 'dueDate'
proof pair contract --self -- 'bun run openapi:print'
```

- The dump command must exist on both sides. When it is new in the change, write the dumper in `$PROOF_RUN/scripts` and call it by path.
- The kit compares one file per promise: a contract spread over many files is concatenated in a stable order (`find … | sort | xargs cat`).
- Exported types: emit declarations (`tsc --declaration --emitDeclarationOnly --outDir`) or the language's doc dump (`go doc -all`), concatenated.
- A CLI's contract is its `--help` output and its exit codes.
- Classify the difference as breaking or additive with a specialist tool on the two dumps (`evidence/contract/base/stdout.txt` and `…/change/stdout.txt`): `oasdiff breaking` for OpenAPI, `graphql-inspector diff` for GraphQL, `buf breaking` for proto. Write its output into the report with `proof note`, or as its own `holds` promise.
- "The contract did not change" is `--expect same`.

## Request and response pairs

One script, the side's address from `proof env`:

```sh
proof env base URL=http://127.0.0.1:4101 && proof env change URL=http://127.0.0.2:4102
```

```sh
# $PROOF_RUN/scripts/refuse-empty-name.sh: prints one JSON object, so the kit can compare fields
status=$(curl -sS -o "$PROOF_OUT/body.json" -w '%{http_code}' -X POST "$URL/items" \
  -H 'content-type: application/json' -d '{"name":""}')
jq -n --arg s "$status" --slurpfile b "$PROOF_OUT/body.json" '{status: ($s | tonumber), body: $b[0]}'
```

```sh
proof claim refuse-empty --text "An empty name is refused" --method "request pair" --expect changed --as json \
  --assert "422 with the error 'name is required' instead of 201" --match '"status": 422'
proof pair refuse-empty --self --ignore-key id --ignore-key createdAt -- 'sh "$PROOF_RUN/scripts/refuse-empty-name.sh"'
```

- Ids and timestamps move on every run: `--self` shows which, `--ignore-key` and `--ignore` remove them.
- A refusal shows the real status and error body, never a paraphrase.
- A route the base does not have is still a pair: the base's 404 is the "before".
- Sign in inside the script. Keep the token in a shell variable and a cookie jar in `mktemp`, never in `$PROOF_OUT`, the output or `proof env`. The kit blanks `authorization`, `cookie`, `set-cookie`, `x-csrf-token` and `x-api-key` lines, as a last line of defence only.
- A session cookie belongs to a host, not a port: two sides on one loopback address overwrite each other's session. Serve them on two addresses (`127.0.0.1` and `127.0.0.2`; macOS needs the second one added as an alias) or sign in to one side at a time.
- Same data on both sides: seed each from the same script before the pair.

## Compatibility, consumers, documentation

All `holds` promises, run against the change:

- **Compatibility**: the previous release of the client or SDK, or requests recorded from it, against the new server.
- **Real consumer**: the real web app or SDK against the real API and database. Two green halves against fakes prove nothing about the pair (`work-verify-claims`).
- **Documentation examples**: extract the examples the change touched and run them; the script fails when an output differs from what the page says.
