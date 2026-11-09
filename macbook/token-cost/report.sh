#!/bin/bash
# Reads only local Claude Code transcripts (~/.claude/projects) and ccusage output. Changes nothing.
# Usage: report.sh [YYYY-MM-DD]   (start date for the dollar simulation, default 40 days ago)
set -euo pipefail

dir="$(cd "$(dirname "$0")" && pwd)"
export TOKEN_COST_START="${1:-$(date -v-40d +%Y-%m-%d)}"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

command -v bun >/dev/null || { echo "bun missing: mise use -g bun@latest" >&2; exit 1; }
command -v ccusage >/dev/null || { echo "ccusage missing: brew install ccusage" >&2; exit 1; }
ccusage claude monthly --json --breakdown > "$tmp/cm.json"

echo "== usage: cost split by token type =="
bun "$dir/usage.ts"
echo
echo "== ctx: context size per call =="
bun "$dir/ctx.ts"
echo
echo "== sim: spend and savings from $TOKEN_COST_START =="
bun "$dir/sim.ts" "$tmp/cm.json"
