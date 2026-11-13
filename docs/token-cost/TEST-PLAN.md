# Test plan: token cost

The final decision on each tool comes from cost per completed task, measured from what the API billed. Never from what the tool claims to have saved (`rtk gain` divides bytes by 4 and reported 96.2M tokens "saved" in a test where the bill went up).

## Run on macOS (first target)

Scripts live in `macbook/token-cost/`. `brew install rtk ccusage` and `mise use -g bun@latest` are also in `macbook/install.sh` (the scripts run on Bun, managed by mise).

The same scripts run on Omarchy. There, `omarchy/install/terminal/app-token-cost.sh` installs Bun, RTK and ccusage through mise, and `apps-docker.sh` enables Docker at boot so the telemetry stack comes back after a reboot.

```bash
macbook/token-cost/setup.sh check      # what is installed and configured, changes nothing
macbook/token-cost/report.sh           # baseline from local transcripts (last 40 days)
macbook/token-cost/report.sh 2026-10-01
```

`report.sh` only reads `~/.claude/projects` and the `ccusage` output. It works without telemetry and is the baseline for step 1 until telemetry has a week of data.

Steps that change configuration are opt-in:

```bash
macbook/token-cost/setup.sh stack up          # Docker: collector, Prometheus, Loki, Grafana
macbook/token-cost/setup.sh telemetry         # writes env into ~/.claude/settings.json, with backup
macbook/token-cost/setup.sh telemetry off
macbook/token-cost/setup.sh stack down
macbook/token-cost/setup.sh agents            # RTK and Caveman for codex, opencode, omp
macbook/token-cost/setup.sh ponytail          # only after the baseline
macbook/token-cost/setup.sh context-mode      # trial, see step 8; `context-mode off` removes it
```

### Agents

`setup.sh agents` covers the non-Claude agents and `setup.sh check` lists all five.

| Agent | RTK | Caveman |
| --- | --- | --- |
| claude | `PreToolUse` hook | plugin |
| codex | `rtk init -g --codex` (hook, `RTK.md`, `AGENTS.md`) | `SessionStart` hook (trust it once with `/hooks`) |
| opencode | plugin `plugins/rtk.ts` | skipped when `AGENTS.md` or `opencode.jsonc` is a symlink, because the installer would write through it |
| pi | extension `rtk.ts` | command `caveman.md` |
| omp | extension `rtk.ts` | native plugin |

The Caveman installer runs from the cached plugin copy, so it downloads no new code. Telemetry and `report.sh` cover Claude Code only: the other agents store sessions in their own formats, so an RTK/Caveman A/B on them is out of scope for now.

### Telemetry stack

`stack up` starts an OpenTelemetry collector, Prometheus, Loki and Grafana from `macbook/token-cost/otel/compose.yaml`. Ports are unusual on purpose and bound to `127.0.0.1` only: `28317` (OTLP gRPC), `28318` (OTLP HTTP), `28300` (Grafana). They sit below the Linux and macOS ephemeral ranges and outside well-known ports, so collisions are unlikely.

A provisioned dashboard, `Claude Code cost` (folder `Claude Code`, uid `claude-code-cost`), shows cost per hour by model, relative cost by token type, cache-write share with a 25% line, cost by arm, a per-model table and the raw events. Filters: `arm` and `model`. Prometheus `increase()` drops the first sample of a new series, so the first minutes of a brand-new session are undercounted.

Prometheus metric names: `claude_code_token_usage_tokens_total` (labels `type`, `model`, `arm`), `claude_code_cost_usage_USD_total`, `claude_code_session_count_total`, `claude_code_active_time_seconds_total`. Events (`api_request`, `tool_result`) go to Loki with `service_name="claude-code"`.

Environment written by `setup.sh telemetry`:

```
CLAUDE_CODE_ENABLE_TELEMETRY=1
OTEL_METRICS_EXPORTER=otlp
OTEL_LOGS_EXPORTER=otlp
OTEL_EXPORTER_OTLP_PROTOCOL=grpc
OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:28317
OTEL_RESOURCE_ATTRIBUTES=arm=rtk_on,caveman=on
```

The attributes follow the current setup: `arm` is `rtk_on` or `rtk_off`, with `_context_mode` appended when that plugin is on, and `caveman` is `on` or `off`. `setup.sh context-mode` refreshes them after installing or removing the plugin.

Without the stack: `ccusage claude weekly --json --breakdown`.

## Order

1. Telemetry and baseline.
2. Investigate the cache-write jump of 6-8 Nov.
3. Measure context: target a median below 200k in the main conversation.
4. Test effort and model per task.
5. Test Ponytail as a plugin for two weeks.
6. A/B of RTK and Caveman.
7. Lean tool results experiment (`fields` in MCP calls, large reads in subagents).
8. Trial of context-mode.

## 1. Telemetry and baseline

Done when there is one week of data with cost per session, cache-write share and average context per call.

## 2. Cache-write jump

Run `/usage` in a long session and read the "Prompt cache (main)" line: hit rate and the reason for the last miss (v2.1.260+). Suspects: model or fast-mode switch mid-session, plugins or MCP servers changed with a session open, Claude Code upgrade.

Done when the cause is found, or cache writes stay below 25% of daily cost for 3 days in a row.

## 3. Context

Hypothesis: `/clear` at the end of each task and verbose work in subagents cut cost, because 73% of it is cache re-reads. Simulation on the logs: 33-35% at 200k, an optimistic ceiling.

Measure the median context per call of the main conversation weekly. Target: below 200k.

## 4. Effort and model

- Low effort on mechanical tasks (rename, format, search). Changing effort keeps the cache on Opus 5.5.
- Simple subagents with `model: haiku`. Anthropic figure: -32% cost, about 4 points lower accuracy.
- Subagents on Sonnet: simulated about 16% of spend, not counting quality loss.

Acceptance: same success rate as the base arm of the A/B below.

## 5. Ponytail

```
/plugin marketplace add DietrichGebert/ponytail
/plugin install ponytail@ponytail
```

Install only from that repository: its README warns about fake copies shipping an `.exe`. As a loose skill it never activated in 10 sessions, so it only makes sense as a plugin. JetBrains tested v4.8.4 and the current one is v5.3.3.

Two weeks of normal use, compared with the baseline.

## 6. A/B of RTK and Caveman

**Tasks:** 10 to 20 fixed tasks, each with a pass/fail criterion (green tests or a known answer). Same commit, fresh worktree per run.

**Arms:**

| Arm | RTK | Caveman |
| --- | --- | --- |
| base | off | off |
| rtk | on | off |
| caveman | off | on |
| both | on | on |

To remove RTK use a settings file without the hook: `claude --settings arm-off.json`. For Caveman: `claude plugin disable caveman`.

**Runs:** 3 to 5 per task and arm, alternating order. `claude -p --output-format json --model claude-opus-5-5` returns usage and cost.

**Primary metric:** cost per successfully completed task. Compare per-task paired medians (Wilcoxon).

**Decision rule:** a cost drop only counts if the success rate does not fall and the difference is larger than the run-to-run variation. Remove only what makes cost per completed task worse.

**Invalidates the test:** a Claude Code upgrade or model change midway.

Signs that compression hurts:

- The same command repeated within one prompt, with `| cat`, `--verbose` or `rtk bypass`.
- The agent asking for full output or reading RTK tee files.
- "Tests pass" contradicted by CI. Failures or warnings cut from the output.
- More turns per task. That is what made RTK more expensive in the JetBrains test (+13.8% turns).

RTK note: Bash is the dominant tool here (about 45k calls in 40 days), so RTK has more surface than in the published tests. Bash is only 8% of tool-result bytes though; see the image finding in the README.

## 7. Lean tool results (idea from OmniRoute)

Hypothesis: requesting only needed fields in MCP calls reduces context without touching the prefix, so it does not break the cache.

- Shortcut: use `fields` in `get_story` and `search_stories` (for example `id`, `name`, `workflow_state`).
- Heavy MCP and log reads (Loki, Grafana) in a subagent that returns only its conclusion.

Measure: average size of MCP `tool_result` per session (`tool_result` event in Loki) and average context per call, before and after.

Optional follow-up: wrap the heaviest text MCP server with `caveman-shrink` as an extra arm, only if measurements show a text-heavy MCP. Current data shows MCP results are small except `chrome-devtools`.

Do not test: modes that rewrite history (`aggressive`, `ultra` in OmniRoute), compression proxies, claude-mem, LLMLingua. Rewriting context breaks the cache.

## 8. Out of scope here

Compare OmniRoute's fallback and quota routing with what `aihub-gateway` does today. That needs the gateway code, which this study did not read.

## Weekly review (10 minutes)

- Cost per session and cache-write share. Above about 25% for several days, look for cache misses.
- Average context per call in the main conversation. Target: below 200k.
- Model and effort used. A change in mix outweighs any tool.
- Output per turn and turns per session.
- `rtk gain -F` (commands RTK could not filter) and `rtk gain --recalls`.
- Read 2 to 3 transcripts looking for wrong conclusions.

## 8. context-mode

`setup.sh context-mode` installs the plugin from `mksglu/context-mode`, and `setup.sh context-mode off` removes it. Telemetry tags those sessions `arm=rtk_on_context_mode`, so the dashboard's "cost by arm" panel compares them with `rtk_on`.

Expect little. The plugin moves large tool outputs into a local sandbox with SQLite search and does not rewrite history, so it keeps the cache. Its "99.4% smaller" figure covers only bench rows with 10 KB or more of raw output. Here text tool results are a small share of bytes (59 MB of text against 1,421 MB of images in 40 days), and images are untouched. It also adds MCP tools and skills to every context, costs extra calls to fetch indexed output, and intercepts Bash like the RTK hook.

One week on, one week off, then compare cost per session and median context per call. Keep it only if cost per session drops by more than the week-to-week variation of the baseline.
