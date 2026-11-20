---
name: proof
description: Prove a change to someone who has only the task's title and description — turn them into promises, offer a menu of proof methods per surface (public API contract and request pairs, architecture and dependency graphs, smoke and e2e tests, screenshots, visual diff or video, bug repro, benchmark, CLI transcript, equivalence for a refactor), run one script unchanged on the base and on the change, and write a report with a verdict per promise. Keeps the plan and the state of the run on disk so a long proof survives a lost context. Use for "prova que funciona", "/proof", "como eu valido isso?", "evidência de antes e depois", or before handing a change to a reviewer.
compatibility: Requires `git` and `bun`. Pixel counts need ImageMagick; each method names its own tools.
metadata:
  kind: workflow
---

# Prove a change

The reader of a proof has the task's title and description and nothing else: not the chat, not the diff, not how the stack starts. A proof tells them what was promised, shows whether each promise holds, and lets them repeat the check. A test shows the code agrees with itself; a proof shows a person what changed.

The mechanical part is `scripts/proof.ts` (the kit). It keeps the plan, runs one command string on both sides, compares and renders the report. What to prove, which method fits, how to start the stack and what the scripts do are yours.

## When not to use

- To decide whether your own work is done: `work-verify-claims` is enough. A proof is for another reader.
- The behaviour has to stay proven over time: a proof is one run. Offer to turn its script into a permanent test.
- A piece the stack needs cannot run on this machine: prove what can be proven, `block` the rest with the reason. A deployed install is never a stand-in for the missing local piece.

## Rules

- **Never bend a script until the promise comes true.** When a side does not show what was promised, the report says what it shows.
- **One script, both sides.** A step done by hand on each side proves nothing about both reaching the same state. Scripts live in `$PROOF_RUN/scripts`, outside both checkouts, so the base runs them even when it is older than they are.
- **The expectation comes before the run.** Changing it afterwards is an amendment with a reason, and the report shows it.
- **By hand is "observed", never "proven".** What you saw yourself goes in with `attach`.
- **Local and throwaway only.** Own ports, own data directories, own database. Never point a proof at an install that holds someone's data.
- **No secret reaches a file**: no token, cookie, sign-in link or e-mail in an output, an image, or `env`. Look at every image before keeping it.
- **Stop only what you started**, by the PID registered with `proc add`. Never by name or pattern.

## Steps

The kit is `bun <this skill's folder>/scripts/proof.ts`, run from the checkout that holds the change; below it is `proof`. Its header lists every command and flag.

1. **Resume or start.** `proof status` first, always. An open run means resume: read its next step and its dead ends. Otherwise `proof init --base <ref> --title <title> --description <description>`, with the task's words as the owner wrote them (the issue, the pull request, the request in the chat), not your summary.
2. **Read the repository's adapter.** A proof skill or tool of the repository (`.agents/skills/proof*`, a `proof` task in `mise.toml`, `package.json` or a `Makefile`, a section in `AGENTS.md`) says how to start and stop each side and which traps it has. Use its tool for the surfaces it covers. With none, find how the stack starts (README, scripts, compose files) and record it with `proof note`.
3. **Write the promises.** One per line, in the words of the person using the change, refusals included. Each one names where it is observed: a route, a screen, a command, a module boundary. Then read the diff against the base: what it does beyond the promises goes in with `proof note --kind extra`.
4. **Choose methods with the owner.** Mark the surfaces the diff touches and read `references/methods.md`. For each promise pick the cheapest method that would convince the reader, and show the alternatives worth offering (screenshots, visual diff or video; contract diff or request pairs). Ask once, with your picks marked. Declare each with `proof claim`: the expectation, and for `changed` what exactly must differ.
5. **Get the plan approved.** `proof plan` prints it; show it and wait. `proof approve` locks it; nothing runs before. With nobody to answer (a subagent, an unattended run), `proof approve --unattended`, and the report says no person approved it.
6. **Set up both sides.** `proof each -- <cmd>` installs and builds on the base worktree and on the change. Start what has to stay up yourself, one instance per side, and register each with `proof proc add`. `proof env` gives a side its own values (a URL, a port), so the command string stays the same.
7. **Run each promise.** Write the script once, then `proof pair <id> --self -- <cmd>`. The verdict comes back at once:
   - `not-proven` because the base differs from itself: normalise what moves (`--ignore`, `--ignore-key`) and `proof compare` again.
   - `contradicted`: the promise is false as written, or the change does something unintended. Report it; do not tune the script.
   - A dead end, or a decision worth remembering: `proof note`. It is what the next session reads.
8. **Report.** `proof report` writes `report.html` and `report.md`. Open the HTML and read it as the reader would: does the top half stand without the chat?
9. **Clean up.** `proof proc stop`, then `proof close` (removes the base worktree; refuses while a process is alive). Check the ports are free.

Pull requests: `report.md` holds the table ready to paste. Putting it in a pull request, or pushing images anywhere, is a separate outward step, done only when the owner asks, with `git-pr`.

## State

Runs live outside the repository, in `~/.local/state/takashi/proof/<repo>/<branch>/<run>/` (`TAKASHI_STATE_DIR` moves the root): `manifest.json` (the source of truth), `PLAN.md`, `journal.jsonl` (every command and note, append-only), `scripts/`, `evidence/<promise>/{base,change,self,manual,compared}/`, the reports. A subagent given the run folder as `PROOF_RUN` and a promise id writes to the same run. `proof prune` lists closed runs of gone or merged branches; it deletes only with `--yes`, when the owner asks.

## Done when

- Every promise is proven, contradicted, observed, or blocked with a reason. None is left "not run".
- The report's top half lets someone with only the title and description check the result.
- Nothing you started is still running, and the base worktree is gone.
- Nothing outside the throwaway installs and the run folder was written to.

## Report

In the chat, in the owner's language: the path of `report.html`, then per promise its verdict in one line. Say plainly what is contradicted, what is only observed, what is blocked, and what the diff does beyond the task. Offer to turn a scripted scenario into a permanent test; never do it unasked.

## References

- `references/methods.md` (~1,500 tokens): the menu. Every method by surface, when it fits and what evidence it leaves. Read at step 4.
- `references/api.md` (~800 tokens): public API recipes (contract diff, request pairs, refusals, compatibility).
- `references/architecture.md` (~800 tokens): dependency graph, boundary rule, module surface, schema, topology.
- `references/tests.md` (~800 tokens): smoke, e2e red on base and green on change, regression, suite comparison, bug repro.
- `references/ui.md` (~850 tokens): screenshots, visual diff, video, matrices, accessibility.
- `references/other.md` (~750 tokens): performance, CLI and libraries, no visible change, data, environment scripts.
- `scripts/proof.ts`: the kit; commands, flags and environment in its header.
