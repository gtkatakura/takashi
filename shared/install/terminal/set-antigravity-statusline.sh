#!/bin/bash

# Antigravity CLI may only be installed later: it picks these settings up on its first run
agy_dir=$HOME/.gemini/antigravity-cli
agy_settings=$agy_dir/settings.json

mkdir -p "$agy_dir"
[ -s "$agy_settings" ] || echo '{}' > "$agy_settings"

tmp=$(mktemp)
jq '.statusLine = {type: "command", command: "~/.local/share/takashi/shared/defaults/antigravity/statusline.sh"}' "$agy_settings" > "$tmp"
mv "$tmp" "$agy_settings"
