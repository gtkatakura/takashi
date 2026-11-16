# Claude Code token cost: study

Study from 9 Nov 2026 on where Claude Code cost goes and which compression tools are worth testing. The test plan and the macOS setup are in [TEST-PLAN.md](TEST-PLAN.md). The reproducible baseline is `macbook/token-cost/report.sh`.

## Data

202 sessions and 52,638 API calls over the last 40 days, read from `~/.claude/projects` (deduplicated by `requestId`). Costs are relative: standard Anthropic multipliers over the input price (cache read 0.1x, cache write 5min 1.25x, cache write 1h 2x, output 5x). Dollar figures are calibrated against `ccusage`, so they match it by construction.

## Findings

- **73.4% of cost is cache reads.** 1h cache writes are 11.4%, 5min cache writes 7.7%, output 7.4%. 96% of cost was Opus 5.5.
- **Context is large.** p50 is 196k tokens per call, p90 is 666k. Calls above 400k are 23% of calls and pay 54% of cache reads.
- **Output compressors have a low ceiling.** The best independent Caveman result cut 8.5% of output. On 7.4% of cost, that is at most about 0.6%.
- **Cache writes jumped on 6-8 Nov.** They went above 30% of daily cost (peak 44.5%), against 13-21% until 5 Nov. Cause still unknown.
- **Spend was $5,217 in 40 days** at API-equivalent prices. Conservative simulation: `/clear` above 200k, avoiding idle gaps past the cache TTL and subagents on Sonnet add up to 40-50% possible savings. All compressors together stay under 1%.
- **Most tool-result bytes are images.** Read results are 89% of all tool-result bytes, and 96% of those are image blocks (1,421 MB of images against 59 MB of text). Bash has about 45k calls but only 8% of the bytes. The tool-result volume that matters is screenshots and images, not text, so text compressors such as RTK do not touch it.

## Verdict per tool

| Tool | Verdict | Reason |
| --- | --- | --- |
| Smaller context (`/clear`, `/rewind`) | Adopt | Attacks the 73% |
| Cache hygiene | Adopt | Do not switch model, MCP or plugin mid-session |
| Effort and model per task | Adopt | Subagent model by task in `~/.claude/CLAUDE.md`: Haiku for mechanical work (translation, reformatting, summaries), Sonnet for exploration and routine edits |
| "Answer concisely." in `CLAUDE.md` | Adopt | A/B on Opus 5.5, 8-turn explanation session: -24% cost against no instruction (ranges do not overlap, n=3). Beat Caveman |
| Ponytail (plugin) | Test | JetBrains: -10.3% cost (p=0.004), quality tied |
| Caveman | Drop | A/B: +15% cost on short Haiku tasks (fixed instructions outweigh shorter replies). Opus explanation session, its best case: -7% cost, no output cut, against -24% for "Answer concisely." |
| RTK | Neutral (kept) | A/B: +0% on short Haiku tasks, +2% on a 9-turn Sonnet session with 245-824 KB command outputs. Claude Code already persists large outputs to files and the model filters with grep, so little reaches the hook. External: JetBrains +7.6%, Quesma +1% per task, gliai +5.8% |
| context-mode | Skip | A/B: +1.4% (Haiku), +7.6% (Sonnet) on short tasks, +6% on the long Sonnet session, its best case. Its own Opus 5.5 A/B: +2.2% |
| Serena, code-graph | Skip | Only worth it on large repositories |
| OmniRoute | Skip | "89%" is arithmetic over third-party claims. An independent review measured about 5% |
| headroom | Skip | A/B: -2.9% on short Haiku tasks and -1% on the long Sonnet session with large MCP JSON, both within noise; the proxy compressed 2.5% of input. Its "21-57%" is an offline token count with an OpenAI tokenizer. Routes all traffic and the OAuth token through a local proxy |
| graphify | Skip | A/B: +11.5% on lookup questions (Haiku); on broad architecture questions (Sonnet, its best case) +1% cost and 13/15 correct against 12/15. Its "71x" compares a query with reading the whole repo |
| claude-mem, LLMLingua, proxies | Skip | Rewriting context breaks the cache |

## A/B results (13 Nov 2026)

Each tool was tested against plain Claude Code in the scenario its own docs name as its best case, plus short tasks. Cost is the billed `total_cost_usd` per completed task or session, read from `claude -p`. Runner: `macbook/token-cost/ab/`; raw rows: `ab-results/`. Steps to rerun are in TEST-PLAN.md step 9.

No compressor lowered cost beyond run-to-run noise. They act on tool output or reply length, while 73% of cost here is cache reads of a large context, and each adds fixed instructions or tool schemas to every session.

Limits: 3 to 5 runs per arm, synthetic tasks, sessions of at most 9 turns, Haiku and Sonnet for most tools.

## What to learn from OmniRoute without installing it

Based on its README and `COMPRESSION_ENGINES.md`, not its code.

- **Trim tool results once, on arrival.** The `headroom` engine (JSON arrays to columnar form) and the `ionizer` engine (sample head, middle and tail, store the middle by hash) target what bloats context most. Done on arrival, the prefix does not change later, so the cache survives. The modes that rewrite history (`aggressive`, `ultra`) break the cache.
- **Large block becomes a hash reference**, retrievable on demand through a tool. Same principle as a subagent that returns only its conclusion.
- **Quota routing with fallback**, `/v1/models/query` and MCP tool description compression. These matter more for an AI gateway than for personal use.

Cheap equivalent of the first point: request only the needed fields in MCP calls, for example the `fields` parameter of the Shortcut tools. `get_story` and `search_stories` return large JSON with full comments and repeated URIs, and every result is re-read on each turn.

## MCP compression tools

- **Tool search** (deferred tool schemas) already keeps MCP tool descriptions out of the context in current Claude Code, so a description compressor has little left to save.
- **`caveman-mcp`** exposes `caveman_compress` and `caveman_retrieve` as tools. The model has to call them itself, so it adds a call per result and cannot intercept results automatically. Its savings are reported as inferred, not verified.
- **`caveman-shrink`** is a proxy that wraps one upstream MCP server. It is opt-in in the Caveman installer (`--with-mcp-shrink`). Because it changes the result before it enters the context, it is cache-safe. It is the only candidate worth a trial, and only if a text-heavy MCP shows up in the measurements. In this data MCP results are small (Shortcut 1.0 MB, Grafana 0.8 MB over 40 days), except `chrome-devtools` at 26.8 MB (screenshots and snapshots).

## Limits of the study

- The Opus 5.5 price in `ccusage` was not checked against the official table.
- The `/clear` simulation assumes the next task did not need the earlier context.
- The JetBrains results used Sonnet 5 and may not transfer to Opus 5.5.
- Transcripts store output already filtered by RTK, so there is no "without RTK" to compare in the logs. Only an A/B answers that.
- The 9 Nov cost includes cache writes from the research agents of the study conversation itself.
- The image share of Read results counts base64 JSON bytes, not tokens. Image token cost is much lower than bytes suggest, so this finding needs a token-based check before acting on it.
