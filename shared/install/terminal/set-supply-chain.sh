#!/bin/bash
# shellcheck source=/dev/null

# Guards for every dependency download, using only each tool's own settings:
# a 7-day cooldown, Socket's malware scanner, no unapproved install scripts.
# See README.md#dependency-download-guards.
# Setup sources this file before it installs any package or tool.

# Run in a process of its own and stop the setup if a guard can't be put in
# place: installing on without the guards would defeat them
if [ "${BASH_SOURCE[0]}" != "$0" ]; then
  bash "${BASH_SOURCE[0]}" || {
    echo "Dependency-download guards are not in place (see the error above). Fix it and rerun setup." >&2
    return 1
  }
  return 0
fi
set -euo pipefail

takashi=~/.local/share/takashi
config_home=${XDG_CONFIG_HOME:-$HOME/.config}
scanner_dir=~/.local/share/bun-security-scanner
cooldown_days=7
cooldown_seconds=$((cooldown_days * 86400))
cooldown_minutes=$((cooldown_days * 1440))

# mise first, so every tool installed from here on waits 7 days too
mise settings set minimum_release_age "${cooldown_days}d"
mise settings set paranoid provenance
command -v bun &>/dev/null || mise use -g bun@latest
command -v npm &>/dev/null || mise use -g node@latest
export PATH="$HOME/.local/share/mise/shims:$PATH"

# Bun: the cooldown alone first, because the scanner fails closed and has to be
# installed before the config points at it
bunfig="$config_home/.bunfig.toml"
printf '[install]\nminimumReleaseAge = %s\n' $cooldown_seconds >"$bunfig"
mkdir -p $scanner_dir
cp $takashi/shared/defaults/bun-security-scanner/{package.json,bun.lock,scanner.mjs} $scanner_dir/
bun install --cwd $scanner_dir --frozen-lockfile
printf '\n[install.security]\nscanner = "%s"\n' "$scanner_dir/scanner.mjs" >>"$bunfig"

# mise npm: tools install through aube, which takes the same scanner
mkdir -p "$config_home/aube"
echo "securityScanner = \"$scanner_dir/scanner.mjs\"" >"$config_home/aube/config.toml"

# macOS without XDG_CONFIG_HOME: Bun reads ~/.bunfig.toml, aube may read Application Support
if [ "$(uname)" = Darwin ] && [ "$config_home" = "$HOME/.config" ]; then
  ln -sfn "$bunfig" ~/.bunfig.toml
  mkdir -p ~/Library/Application\ Support/aube
  ln -sfn "$config_home/aube/config.toml" ~/Library/Application\ Support/aube/config.toml
fi

# npm, for third-party projects that use it
npm config set --location=user min-release-age $cooldown_days
npm config set --location=user strict-allow-scripts true
npm config set --location=user allow-git root
npm config set --location=user allow-remote root

# pnpm, for third-party projects that use it: 10 keeps its own config file, 11+ another
for pnpm in pnpm@10 pnpm@latest; do
  mise x -C ~ $pnpm -- pnpm config set --global minimumReleaseAge $cooldown_minutes
  mise x -C ~ $pnpm -- pnpm config set --global trustPolicy no-downgrade
done

# uv, and the pip of third-party projects (PIP_REQUIRE_VIRTUALENV is set in
# shared/defaults/bash/supply-chain.sh). uv has no config command: write the key
uv_toml="$config_home/uv/uv.toml"
mkdir -p "$(dirname "$uv_toml")" && touch "$uv_toml"
grep -q '^exclude-newer *=' "$uv_toml" ||
  printf 'exclude-newer = "%s days"\n%s' $cooldown_days "$(cat "$uv_toml")" >"$uv_toml"

# Bundler, for third-party Ruby projects. The key takes effect from Bundler 4.0.13 on
if bundle --version &>/dev/null; then
  bundle config set --global cooldown $cooldown_days
fi

# Agent CLIs don't update themselves, so they change only through `mise upgrade`
set_json() {
  local file=$1 filter=$2 tmp
  mkdir -p "$(dirname "$file")"
  [ -s "$file" ] || echo '{}' >"$file"
  tmp=$(mktemp)
  jq "$filter" "$file" >"$tmp" && mv "$tmp" "$file"
}
set_json ~/.claude/settings.json '.env.DISABLE_AUTOUPDATER = "1" | .env.DISABLE_UPDATES = "1"'
set_json ~/.copilot/config.json '.autoUpdate = false'
set_json "$config_home/opencode/opencode.json" '.autoupdate = false'
codex_toml=~/.codex/config.toml
mkdir -p ~/.codex && touch $codex_toml
grep -q '^check_for_update_on_startup' $codex_toml ||
  printf 'check_for_update_on_startup = false\n%s' "$(cat $codex_toml)" >$codex_toml
grok_toml=~/.grok/config.toml
mkdir -p ~/.grok && touch $grok_toml
if ! grep -q '^auto_update *= *false' $grok_toml; then
  if grep -q '^\[cli\]' $grok_toml; then
    awk '{ print } /^\[cli\]/ { print "auto_update = false" }' $grok_toml >$grok_toml.tmp && mv $grok_toml.tmp $grok_toml
  else
    printf '\n[cli]\nauto_update = false\n' >>$grok_toml
  fi
fi
