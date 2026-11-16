# Failure-mode catalog

Classes of defect that ship real bugs: lost or corrupted data, wrong results, security holes,
hangs. Each class comes from a published catalog or study, and its name lets one finding point
at every other instance of the same mistake. Style, naming and structure belong to the
Standards axis, not here.

Each entry reads: **name** (source) — what goes wrong. *Cues:* what to look for in a diff.
*Fix:* the usual remedy. A cue is a reason to look closer, never a finding by itself.

## How to use it

1. Read the diff against the cues of every family below.
2. A finding names its class, the concrete scenario (this input or state, then this wrong
   outcome) and its evidence: **confirmed** (a failing test or a reproduction) or
   **plausible** (the scenario, not reproduced). A finding without a scenario is not one.
3. **Variant analysis**: for each confirmed finding, search the whole repository, not only
   the diff, for the same pattern, and list the siblings.
4. When two or more findings share a class, look for the single design decision behind them
   (for example, one global credential every caller reads). Removing it often fixes them all,
   where patching each one does not.

## 1. Concurrency and shared state

Sources: Berenson et al., "A Critique of ANSI SQL Isolation Levels" (SIGMOD 1995); Lu et al.,
"Learning from Mistakes" (ASPLOS 2008), where atomicity and order violations make up 97% of the
non-deadlock concurrency bugs studied; Kleppmann, *Designing Data-Intensive Applications*,
ch. 7.

- **Lost update** (Berenson et al., P4) — two read-modify-write cycles on one record
  interleave and one write is lost. *Cues:* get, change, set on a row, a Redis key or a file
  outside a transaction, lock or compare-and-swap; `SELECT` then `UPDATE … SET x = <value
  computed in Go>`. *Fix:* an atomic operation (`UPDATE … SET x = x + $1`, `INCRBY`, a Lua
  script), a version column with a conditional update, or a lock every writer takes.
- **Check-then-act, TOCTOU** (CWE-367) — a condition is checked and then acted on, and the
  world changes in between, or the check tests something weaker than what the act needs.
  *Cues:* `if !exists { create }`; `if spent+cost <= limit { reserve }` as two calls;
  `os.Stat` before opening; a dry run that does not go through the real write path. *Fix:*
  let the act carry the check (unique constraint, `INSERT … ON CONFLICT`, `O_EXCL`,
  conditional update, `SET NX`), or check inside the same lock or transaction.
- **Write skew** (Berenson et al., A5B) — two transactions read an invariant over several rows
  (a sum under a limit) and each writes a different row; both pass and the invariant breaks.
  *Cues:* an invariant over a set of rows checked under Read Committed. *Fix:* lock a parent
  row (`SELECT … FOR UPDATE`), serializable isolation, or keep the invariant in one row.
- **Atomicity or order violation** (Lu et al.) — a compound action on shared memory split
  across steps, or code assuming another goroutine already ran. *Cues:* a field written by one
  goroutine and read by another without a mutex or channel; lazy initialization without
  `sync.Once`; a result read before `wg.Wait()`. *Fix:* one owner, a mutex around the whole
  compound action, `sync.Once`; tests under `-race`.
- **Deadlock or reentrancy** (CWE-833, CWE-667) — locks taken in different orders, or a
  non-reentrant lock (a `sync.Mutex`, a file lock) taken again by its holder. *Cues:* nested
  locks; a function that locks calling another that locks the same thing. *Fix:* one lock
  order; take the lock at one level only.
- **Leaked goroutine or resource** (CWE-772, CWE-404) — a goroutine blocked for good on a
  channel nobody reads, a response body never closed, a timer never stopped. *Cues:* `go func`
  sending on an unbuffered channel the caller may abandon; `resp.Body` without `Close`;
  `time.After` in a loop. *Fix:* a buffered channel or a `select` on `ctx.Done()`;
  `defer Close`; `time.NewTimer` with `Stop`.

## 2. Writes that must survive a failure

Sources: Mohan et al., ARIES (TODS 1992); Pillai et al., "All File Systems Are Not Created
Equal" (OSDI 2014), on crash-consistency bugs in widely used applications; Kleppmann, chs. 7
and 11;
Richardson, "Transactional outbox" (microservices.io).

- **Act before record** (write-ahead logging, ARIES) — an effect happens before what is needed
  to undo or finish it is recorded, and a crash or error in between loses it. *Cues:* write a
  file, then save its original; call a provider, then reserve the budget; delete, then log.
  *Fix:* record the intent first, and make a record without its effect harmless.
- **Non-atomic file write** (Pillai et al.) — a file others read is rewritten in place, and a
  crash leaves it torn or empty. *Cues:* `os.WriteFile` on a state or config file. *Fix:*
  write a temporary file in the same folder, sync it, rename it over the original.
- **Dual write** (transactional outbox) — one change written to two systems in sequence
  (Postgres and Redis, a database and a queue); the second fails or the process dies, and the
  two disagree for good. *Cues:* writes to two stores in one handler with no reconciler.
  *Fix:* one source of truth with derived copies, an outbox read by a relay, or a periodic
  reconciliation.
- **Partial batch** (atomicity, Kleppmann, ch. 7) — a loop over items stops at the first
  failure, leaving some done and some not, or an operation and its inverse (setup and uninstall,
  charge and refund) treat failure differently. *Cues:* `return err` inside a loop that writes;
  twin loops with `continue` in one and `return` in the other. *Fix:* validate every item before
  writing any; give an operation and its inverse the same failure policy; report per item.
- **Non-idempotent retry** (Leach, "Designing robust and predictable APIs with idempotency",
  Stripe, 2017; Kleppmann, ch. 11) — a retried request, a redelivered message or a rerun
  repeats a side effect (a charge, a spend record, a notification). *Cues:* retry loops around
  writes; queue consumers; handlers with no idempotency key or unique constraint. *Fix:* an
  idempotency key backed by a unique constraint; an upsert.
- **Destructive recovery** (fail-safe defaults, Saltzer and Schroeder, 1975) — given input it
  cannot parse, the code overwrites or deletes it, or its recovery advice destroys the
  evidence. *Cues:* a parse-error branch that writes; `os.Remove` with no copy; "reset" paths.
  *Fix:* keep the original aside, refuse, or ask.

## 3. Error handling

Source: Yuan et al., "Simple Testing Can Prevent Most Critical Failures" (OSDI 2014): 92% of
the catastrophic failures studied came from wrong handling of errors the software had already
signaled, many of them from the first three patterns below.

- **Ignored error** (CWE-252, CWE-390) — an error is dropped, or logged, and the code goes on
  as if it succeeded. *Cues:* `_ =`; `if err != nil { log… }` followed by use of the result; a
  zero value returned with a nil error. *Fix:* return it, or handle it so the state stays
  correct, and test that branch.
- **Overly broad handling** (CWE-396; Yuan et al.) — every error treated alike: retrying a
  4xx, aborting on a recoverable error, mapping a permission error to "not found". *Cues:*
  `if err != nil` with no `errors.Is` or `errors.As` where the kinds call for different
  actions; catch-all retries. *Fix:* decide per kind; retry only what can succeed on retry.
- **Unfinished handler** (Yuan et al.) — a TODO, a `panic` or an empty block on an error path.
  *Cues:* `TODO` or `FIXME` inside `if err != nil`; `panic(err)` outside `main` and startup; an
  error branch that does nothing. *Fix:* handle the error, or return it to a caller that can.
- **Silent failure** (CWE-393) — a command or endpoint tells the person it failed but returns
  success to its caller (exit 0, HTTP 200), or the reverse. *Cues:* an error printed, then
  `return nil`. *Fix:* a status a script or client can act on.
- **Fail-open check** (CWE-636) — a validation or security check that passes when its own
  dependency fails: a missing tool, an unreachable policy service, an error read as "allowed".
  *Cues:* `test -z "$(tool …)"`; `if err != nil { return true }` on an authorization path.
  *Fix:* fail closed.

## 4. Time, limits and resources

Sources: Nygard, *Release It!* (2nd ed., 2018); Brooker, "Timeouts, retries, and backoff with
jitter" (AWS Builders' Library); Beyer et al., *Site Reliability Engineering*, "Addressing
Cascading Failures"; Kleppmann, ch. 8.

- **Unbounded wait** (Nygard, Timeouts) — a call to a process, the network or a lock with no
  deadline, or with one that does not hold. *Cues:* `exec.Command` without a context;
  `http.Client{}` without `Timeout`; `context.Background()` inside a request path; a context
  not passed down; `cmd.Output()` without `WaitDelay` when a child process can keep the pipe
  open. *Fix:* a deadline on every external call, carried down from the caller's.
- **Inverted timeout budget** (Beyer et al., deadline propagation) — an inner timeout, or the
  total of its retries, outlasts the caller's deadline: work goes on after nobody waits, or the
  caller gives up while retries pile up. *Cues:* retries × per-try timeout > the outer timeout.
  *Fix:* derive inner deadlines from the incoming context.
- **Retry storm, thundering herd** (Brooker; SRE book) — retries without backoff and jitter
  multiply the load on a dependency that is already failing; many clients refresh an expired
  cache entry at once. *Cues:* fixed-interval retries; retries at several layers; expiry with
  no single-flight. *Fix:* capped exponential backoff with jitter, retries at one layer,
  `singleflight`.
- **Unbounded consumption** (CWE-400, CWE-770; OWASP API4:2023) — an input, a result set, a
  cache, a queue, a log or a backup folder that grows with no limit. *Cues:* `io.ReadAll` on a
  body; queries without `LIMIT`; a map used as a cache with no eviction; files kept forever.
  *Fix:* limit, paginate, evict, prune.
- **Clock assumptions** (Kleppmann, ch. 8) — wall-clock time used for durations, a business
  day computed in the wrong time zone, events ordered by timestamps from different machines.
  *Cues:* "today" without an explicit location; durations from times that lost their monotonic
  reading (serialized, `Round(0)`); cross-host ordering by clock. *Fix:* monotonic time for
  durations, an explicit location for business days (a daily budget's day), no ordering by
  another host's clock.

## 5. Authority and trust boundaries

Sources: Hardy, "The Confused Deputy" (1988); OWASP API Security Top 10 (2023); MITRE CWE.

- **Confused deputy, ambient authority** (Hardy) — an operation acts with authority it finds
  in its environment (a global credential, the "current" tenant, an inherited environment
  variable) instead of what its caller is entitled to; the caller never says for what. *Cues:*
  one key, token or client shared by several callers; credentials picked from global config
  rather than from the request; an environment variable choosing which secret is read. *Fix:*
  bind each caller to its own authority and pass it explicitly.
- **Missing object-level authorization** (OWASP API1:2023, CWE-639) — an endpoint loads an
  object by an ID from the request without checking that the caller owns it or belongs to its
  tenant. *Cues:* `repo.Get(ctx, req.ID)` with no owner or tenant in the query. *Fix:* scope
  every lookup by the caller's identity.
- **Untrusted input in a security decision** (CWE-807, CWE-451) — a decision, or a
  confirmation shown to a person, based on a value the caller controls: a header, a display
  name, an environment variable. *Cues:* a user, tenant or forwarded-for header read after the
  auth middleware set the identity; a name from the request shown in a confirmation; an
  environment variable that picks the host a secret goes to. *Fix:* decide on the
  authenticated identity; show the real target next to any label.
- **Injection** (CWE-78, CWE-89, CWE-22, CWE-184) — a shell command, SQL, a path or a URL built
  by concatenating input, or "sanitized" with a list of bad characters. *Cues:* `sh -c` with
  formatted strings; `fmt.Sprintf` into SQL; `filepath.Join(base, input)` with no check that
  the result stays under `base`; a denylist. *Fix:* argument arrays, query parameters, an
  allowlist, a `filepath.Rel` check.
- **Server-side request forgery** (CWE-918) — the server fetches a URL taken from input and
  reaches internal hosts. *Cues:* downloading images, files or webhooks from URLs in requests.
  *Fix:* allowlist schemes and hosts, resolve and block private ranges, no redirects into them.
- **Secrets or personal data in logs and errors** (CWE-532, CWE-209) — keys, tokens, headers,
  request bodies or emails written to logs and traces, or upstream errors returned verbatim.
  *Cues:* logging a request or a struct that holds a credential; `err.Error()` from a provider
  sent to the client. *Fix:* log identifiers, redact, map upstream errors to fixed messages.

## 6. Comparisons, numbers and data fidelity

Sources: MITRE CWE (697, 682, 190, 193, 1339); Kleppmann, ch. 4; Myers, *The Art of
Software Testing*, boundary-value analysis.

- **Incorrect comparison** (CWE-697) — equality defined too loosely or too strictly:
  normalizing away meaningful characters, case-folding identifiers, `==` on floats, on
  `time.Time` (location and monotonic reading) or on pointers instead of values. *Cues:*
  `strings.EqualFold` or `ToLower` on IDs and keys; `==` on `float64` or `time.Time`; serialized
  text (JSON, TOML) compared where the data is what matters. *Fix:* compare canonical forms
  that keep the meaning (decoded data, `Equal` methods).
- **Lossy round-trip** (Kleppmann, ch. 4) — reading data into a model and writing it back drops
  what the model does not hold: unknown JSON fields, comments, int64 precision through
  `float64`, order. *Cues:* unmarshal into a struct and marshal back over the original; numbers
  in `map[string]any`. *Fix:* edit in place; `UseNumber`; keep unknown fields.
- **Money and precision** (CWE-682, CWE-1339) — money in floating point, rounding per item
  instead of on the total, unit mix-ups (per token and per million tokens). *Cues:* `float64`
  in a price, cost or spend field; rounding inside a loop over items; a price per token next to
  one per million. *Fix:* integer minor units or a decimal type, one rounding, units in the
  names.
- **Integer overflow or narrowing** (CWE-190) — `int64` into `int32`, token counts or sizes
  multiplied past their type. *Cues:* `int32(x)` or `int(x)` from a wider type; counts from a
  request multiplied before any check. *Fix:* check the bounds before narrowing.
- **Boundary and empty cases** (CWE-193; Myers) — off by one at a limit (`>=` or `>`), empty
  versus nil (`null` or `[]` in JSON), a zero value meaning "unset". *Cues:* `<` against `<=`
  at a limit or a length; `omitempty` on a field where zero is a real value; a nil slice and an
  empty one encoded differently. *Fix:* tests at the boundary; pointers or an explicit "set"
  flag for optional values.

## 7. Divergence and stale state

Sources: Hunt and Thomas, *The Pragmatic Programmer* (DRY); Zhang et al., "Understanding and
Detecting Software Upgrade Failures in Distributed Systems" (SOSP 2021), where most upgrade
failures studied came from two versions disagreeing on the syntax or meaning of persistent data
or network messages; Meyer, command-query separation; Nishtala et al., "Scaling Memcache at
Facebook" (NSDI 2013); MITRE CWE.

- **Divergent copies of one rule** (Hunt and Thomas, DRY) — one predicate, list or value
  kept in two places that drift apart: two definitions of "enabled", two lists of supported
  items, a test fixture that no longer matches production, a literal where the program already
  has the real value (a context window, a price, a URL). *Cues:* a condition copied instead of
  called; parallel lists of IDs; a constant next to data that carries the same value. *Fix:*
  one source, or a test that ties the copies together; a literal only as the fallback. The
  Standards axis reports duplication as a smell; report it here only when the copies already
  disagree, or when a scenario shows an edit to one of them changing behavior.
- **Incomplete cache invalidation** (Nishtala et al.) — a cache key or invalidation trigger
  misses an input, so stale data is served after an update (a catalog edited in the admin, a
  file deleted). *Cues:* a cache key built from part of the inputs (no tenant, brand or model
  ID); an admin write path with no delete or version bump; a TTL as the only invalidation.
  *Fix:* key by every input; invalidate on every write path.
- **Incompatible upgrade** (Zhang et al.) — data, files or messages written by the previous
  version are misread by the new one, or the previous version cannot read what the new one
  writes during a rollout or a rollback. *Cues:* renamed or newly required fields; migrations
  that are not forward-safe; a new on-disk layout with no reader for the old one. *Fix:* read
  both; expand and contract in separate releases.
- **Side effect in a query** (command-query separation) — a read-only path (a dry run, a
  preview, a GET, a status) writes; or a side effect (a restart, a notification) runs without
  the change that justifies it. *Cues:* a `--dry-run`, preview or status path that saves a
  cache or a file; a GET handler that writes; a restart not gated on a changed file. *Fix:*
  gate every write on the real run and on a real change.
- **Persisted ephemeral reference** (CWE-672) — a path, PID, port or temporary credential saved
  where it outlives what it points to (a `go run` build, a temporary folder). *Cues:*
  `os.Executable()`, a temporary path, a PID or a port written to a config or state file.
  *Fix:* persist stable references only.
