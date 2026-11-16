# Global instructions

Loaded in every opencode session: linked to `~/.config/opencode/AGENTS.md` by `omarchy/install/terminal/set-agent-skills.sh`.

## Language

- Talk to me in the language I write in (usually Brazilian Portuguese).
- Write repository artifacts (code, comments, commits, PR descriptions, issues, docs) in the repository's language, usually English.

## Git

- Commit or push only when I ask. If on the default branch, create a branch first.
- Conventional commits with a scope and an explanatory body. No co-author trailer.
- Never force-push or rewrite pushed history without my explicit OK. Amend only your own unpushed commits.
- Before editing or committing on a branch someone else may be working on: check `git status` for their uncommitted work (touch nothing if there is any), and check that `HEAD` has not moved since you last read it.
- After any scripted edit (sed, perl, a codemod), typecheck right away: scripted replacements break indentation, duplicate closers, or land imports inside other imports.

## Scripts and tooling

- Prefer TypeScript run with Bun for scripts, CLIs and AI tooling (skill helpers, agents, LLM integrations). Avoid Python when TypeScript + Bun can do the job.
- Call tools by bare name (`gh`, `bun`), never by an absolute install path. If a tool is missing, say how to install it (`mise use -g ...`) instead of working around it.

## Delegating to specialists

- The specialist agents (`reviewer`, `frontend`) own the skills and MCP tools for their kind of work; the main session does not see them. Delegate when a task matches an agent's description. I can also switch to an agent with Tab for a longer interactive session.
- A subagent starts from a fresh context: brief it with the goal, the repository and paths, the constraints, and what is already known or ruled out. Ask for a compact result.
- Delegate work that reads a lot and ends in a compact result (reviews, audits, log triage, scaffolding). Keep in the main session what needs this conversation or back-and-forth with me.
- For a non-trivial change, offer a `reviewer` pass over the local changes before saying it is done.

## Evidence

Before saying something works, is done, or is a bug, follow the `work-verify-claims` skill: label claims as verified or inferred, and report what was not tested.
