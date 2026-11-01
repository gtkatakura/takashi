#!/bin/bash

# Claude may only be installed later: it picks these settings up on its first run
claude_dir=${CLAUDE_CONFIG_DIR:-$HOME/.claude}
claude_settings=$claude_dir/settings.json

mkdir -p "$claude_dir"
[ -f "$claude_settings" ] || echo '{}' > "$claude_settings"

tmp=$(mktemp)
jq '.statusLine = {type: "command", command: "~/.local/share/takashi/shared/defaults/claude/statusline.sh"}' "$claude_settings" > "$tmp"
mv "$tmp" "$claude_settings"
