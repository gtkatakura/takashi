#!/bin/bash
# Token-cost tooling for macOS. Idempotent. Default command only reports state and changes nothing.
#
#   setup.sh check                     show what is installed and configured
#   setup.sh agents                    wire RTK and Caveman into codex, opencode and omp (pi is done by its own extensions)
#   setup.sh stack up|down|status      local Docker stack: collector, Prometheus, Loki, Grafana (otel/compose.yaml)
#   setup.sh telemetry [endpoint]      add OpenTelemetry env to ~/.claude/settings.json (backup kept);
#                                      default endpoint is the local stack, http://127.0.0.1:28317
#   setup.sh telemetry off             remove it
#   setup.sh ponytail                  install the Ponytail plugin (trial, see docs/token-cost/TEST-PLAN.md)
set -euo pipefail

settings="$HOME/.claude/settings.json"
dir="$(cd "$(dirname "$0")" && pwd)"
default_endpoint="http://127.0.0.1:28317"
cmd="${1:-check}"

caveman_installer() { ls -d "$HOME"/.claude/plugins/cache/caveman/caveman/*/installer/install.js 2>/dev/null | tail -1; }

agent_state() {
  echo "-- other agents"
  mark() { if "${@:2}"; then echo "ok       $1"; else echo "missing  $1"; fi; }
  mark "codex rtk hook"      grep -q "rtk" "$HOME/.codex/hooks.json"
  mark "codex caveman hook"  test -d "$HOME/.codex/caveman"
  mark "opencode rtk plugin" test -f "$HOME/.config/opencode/plugins/rtk.ts"
  mark "opencode caveman"    test -d "$HOME/.config/opencode/plugins/caveman"
  mark "omp rtk extension"   test -f "$HOME/.omp/agent/extensions/rtk.ts"
  mark "omp caveman plugin"  test -d "$HOME/.omp/caveman-plugin"
  mark "pi rtk extension"    test -f "$HOME/.pi/agent/extensions/rtk.ts"
  mark "pi caveman command"  test -f "$HOME/.pi/agent/commands/caveman.md"
}

agents() {
  local inst; inst="$(caveman_installer)"
  [ -n "$inst" ] || { echo "caveman plugin not found; run: claude plugin install caveman@caveman" >&2; exit 1; }
  command -v codex >/dev/null && rtk init -g --codex </dev/null
  command -v opencode >/dev/null && rtk init -g --opencode --no-patch
  command -v omp >/dev/null && rtk init -g --agent omp --auto-patch
  local only=(); command -v codex >/dev/null && only+=(--only codex); command -v omp >/dev/null && only+=(--only omp)
  # opencode: the caveman installer also rewrites AGENTS.md and opencode.jsonc. Here they are symlinks into another
  # repo, so skip it unless they are regular files.
  if command -v opencode >/dev/null; then
    if [ -L "$HOME/.config/opencode/AGENTS.md" ] || [ -L "$HOME/.config/opencode/opencode.jsonc" ]; then
      echo "skip     caveman for opencode: AGENTS.md or opencode.jsonc is a symlink (installer would write through it)"
    else only+=(--only opencode); fi
  fi
  [ ${#only[@]} -eq 0 ] || node "$inst" "${only[@]}"
  echo "next: in Codex run /hooks and trust the caveman hook once; restart codex, opencode and omp."
}

check() {
  for bin in rtk ccusage claude; do
    if command -v "$bin" >/dev/null; then echo "ok       $bin $($bin --version 2>&1 | head -1)"; else echo "missing  $bin"; fi
  done
  bun "$dir/settings.ts" check "$settings"
  agent_state
}

telemetry() {
  local endpoint="${1:-$default_endpoint}"
  cp "$settings" "$settings.bak-token-cost"
  bun "$dir/settings.ts" telemetry "$settings" "$endpoint"
  echo "done. backup: $settings.bak-token-cost. Restart Claude Code sessions to apply."
}

stack() {
  case "${1:-status}" in
    up) docker compose -f "$dir/otel/compose.yaml" up -d; echo "Grafana http://127.0.0.1:28300  OTLP gRPC 127.0.0.1:28317" ;;
    down) docker compose -f "$dir/otel/compose.yaml" down ;;
    status) docker compose -f "$dir/otel/compose.yaml" ps ;;
    *) echo "usage: setup.sh stack up|down|status" >&2; exit 1 ;;
  esac
}

ponytail() {
  claude plugin marketplace add DietrichGebert/ponytail
  claude plugin install ponytail@ponytail
}

case "$cmd" in
  check) check ;;
  agents) agents ;;
  stack) stack "${2:-}" ;;
  telemetry) telemetry "${2:-}" ;;
  ponytail) ponytail ;;
  *) sed -n 2,13p "$0"; exit 1 ;;
esac
