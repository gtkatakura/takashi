#!/bin/bash

# Disable telemetry and data collection for every coding agent CLI (env vars live in shared/defaults/bash/telemetry.sh).
# CLIs may only be installed later: each one picks these settings up on its first run.
(
  set -euo pipefail

  config_home=${XDG_CONFIG_HOME:-$HOME/.config}

  set_json() {
    local file=$1 filter=$2 tmp
    mkdir -p "$(dirname "$file")"
    [ -s "$file" ] || echo '{}' >"$file"
    tmp=$(mktemp)
    jq "$filter" "$file" >"$tmp" && mv "$tmp" "$file"
  }

  # Antigravity CLI
  set_json "$HOME/.gemini/antigravity-cli/settings.json" '.enableTelemetry = false'

  # Claude Code (keeps local OpenTelemetry CLAUDE_CODE_ENABLE_TELEMETRY untouched)
  set_json "${CLAUDE_CONFIG_DIR:-$HOME/.claude}/settings.json" '.env.DISABLE_TELEMETRY = "1" | .env.DISABLE_ERROR_REPORTING = "1"'

  # OpenCode (no separate usage telemetry; disable session sharing to opncd.ai)
  set_json "$config_home/opencode/opencode.json" '.share = "disabled"'

  # Pi coding agent
  set_json "$HOME/.pi/agent/settings.json" '.enableInstallTelemetry = false'

  # Codex CLI
  codex_toml=$HOME/.codex/config.toml
  mkdir -p "$(dirname "$codex_toml")" && touch "$codex_toml"
  if grep -q '^\[analytics\]' "$codex_toml"; then
    tmp=$(mktemp)
    awk '
      /^\[analytics\]/ { in_sec = 1; print; next }
      /^\[/ {
        if (in_sec && !done) { print "enabled = false"; done = 1 }
        in_sec = 0
        print
        next
      }
      in_sec && /^enabled *=/ { print "enabled = false"; done = 1; next }
      { print }
      END { if (in_sec && !done) print "enabled = false" }
    ' "$codex_toml" >"$tmp" && mv "$tmp" "$codex_toml"
  else
    printf '\n[analytics]\nenabled = false\n' >>"$codex_toml"
  fi
)
