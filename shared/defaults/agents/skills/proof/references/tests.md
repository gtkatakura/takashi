# Proving with tests

A green test on the change proves little alone: it may pass for any implementation, or not run at all. A test becomes evidence when the same test is red on the base and green on the change.

Test runners often write to stderr, and the kit matches on stdout: end the command with `2>&1` when a promise uses `--match` or `--gone`.

## Smoke

In every proof of something that runs. One `holds` promise whose script starts from a clean state, waits for health, walks one critical path and exits non-zero on the first failure:

```sh
proof claim smoke --text "The app starts from a clean checkout and serves the main path" --method smoke --expect holds
proof pair smoke -- 'sh "$PROOF_RUN/scripts/smoke.sh"'
```

Name the path it walked in the promise's text: "smoke passed" says nothing to the reader.

## E2E of the use case

A black-box script in `$PROOF_RUN/scripts`, driving each side through its address (`proof env`), with assertions that fail the script:

```sh
proof claim e2e-due-date --text "A person can set a due date on an item and see it in the list" \
  --method "e2e scenario" --expect changed --as exit \
  --assert "the scenario fails on base at 'set the due date' and passes on the change" --exit-base 1 --exit-change 0
proof pair e2e-due-date -- 'bun "$PROOF_RUN/scripts/due-date.e2e.ts" 2>&1'
```

- Check why the base is red: a base that fails because the stack never started proves nothing. Read `evidence/<id>/base/stdout.txt`, or add `--gone` with the failure you expect.
- Write step screenshots and the video into `$PROOF_OUT` (see `ui.md`).
- The script imports its own dependencies: give `$PROOF_RUN/scripts` a `package.json` and install there, since a file outside the repository does not see the repository's `node_modules`.

## Regression test

The new test lives in the change. Bring the same file to the base, then run it on both:

```sh
proof each -- 'git checkout <change-sha> -- path/to/the.test.ts'   # no-op on the change
proof claim regression --text "The regression test for the crash fails without the fix" --method "regression test" \
  --expect changed --as exit --assert "red on base, green on the change" --exit-base 1 --exit-change 0
proof pair regression -- 'bun test path/to/the.test.ts 2>&1'
```

This needs the test committed. Red on the base is also the check that the test tests the fix.

## Suite comparison

Each side prints the names of its failing tests, sorted; the promise is `same`. Tests already red on the base stay visible instead of being blamed on the change, and a new failure contradicts the promise.

```sh
proof pair suite --self --timeout 1800 -- 'sh "$PROOF_RUN/scripts/failing-tests.sh"'
```

`--self` exposes flaky tests: a suite that differs from itself cannot show that nothing broke.

## Bug repro

A script that does what the bug report did. On the base it shows the real error; on the change it does not:

```sh
proof claim repro --text "Saving an item with an emoji in the name no longer fails" --method "bug repro" \
  --expect changed --as text --assert "the 500 with 'invalid byte sequence' is gone" --gone 'invalid byte sequence'
```

A bug that cannot be reproduced on the base is not proven fixed: say so, and `block` the promise with what was tried.

## CI on HEAD

A `holds` promise that the checks ran on the current commit and included the new tests (`gh pr checks`, `gh run view`). `git-pr` has the procedure. A green run on an older commit is not evidence.
