#!/bin/bash
# shellcheck source=/dev/null

# Guards for every dependency download (Bun, npm, pnpm, uv, mise), with no
# proxy and no shell aliases. See README.md#dependency-download-guards.
# Order matters: the scanner fails closed, so it is installed before any
# config points at it. Rerun after changing the scanner pin.
# Setup sources this file before it installs any package or tool.

# Run in a process of its own, so nothing leaks into the other installers, and
# stop the whole setup with a clear message if a guard can't be put in place:
# installing on without the guards would defeat them
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

# Set key=value in an ini-style file (~/.npmrc), replacing an existing key
set_ini_key() {
  local file=$1 key=$2 value=$3
  touch "$file"
  if grep -q "^$key=" "$file"; then
    sed -i.bak "s|^$key=.*|$key=$value|" "$file" && rm -f "$file.bak"
  else
    echo "$key=$value" >>"$file"
  fi
}

# Set a top-level key: value in a flat YAML file
set_yaml_key() {
  local file=$1 key=$2 value=$3
  touch "$file"
  if grep -q "^$key:" "$file"; then
    sed -i.bak "s|^$key:.*|$key: $value|" "$file" && rm -f "$file.bak"
  else
    echo "$key: $value" >>"$file"
  fi
}

# Merge a jq filter into a JSON file, creating it if needed
set_json() {
  local file=$1 filter=$2 tmp
  mkdir -p "$(dirname "$file")"
  [ -s "$file" ] || echo '{}' >"$file"
  tmp=$(mktemp)
  jq "$filter" "$file" >"$tmp" && mv "$tmp" "$file"
}

# 1. Scripts on PATH: bun-noscan (offline and bootstrap) and verify-supply-chain
mkdir -p ~/.local/bin
ln -sfn $takashi/shared/bin/bun-noscan ~/.local/bin/bun-noscan
ln -sfn $takashi/shared/bin/verify-supply-chain ~/.local/bin/verify-supply-chain

# 2. mise first, so every tool installed from here on waits 7 days too
mise settings set minimum_release_age "${cooldown_days}d"
mise settings set paranoid provenance
# bun runs the scanner; node and npm are what verify-supply-chain checks npm with
command -v bun &>/dev/null || mise use -g bun@latest
command -v npm &>/dev/null || mise use -g node@latest
export PATH="$HOME/.local/share/mise/shims:$PATH"

# 3. The pinned Socket scanner, installed with the scanner turned off
mkdir -p $scanner_dir
cp $takashi/shared/defaults/bun-security-scanner/{package.json,bun.lock,scanner.mjs} $scanner_dir/
(cd $scanner_dir && ~/.local/bin/bun-noscan install --frozen-lockfile) ||
  { echo "Installing the Socket scanner failed: check the network and rerun" >&2; exit 1; }

# 4. Bun: 7-day cooldown and the scanner, for bun install/add and bunx anywhere
cat >"$config_home/.bunfig.toml" <<EOF
# Written by takashi (shared/install/terminal/set-supply-chain.sh)
[install]
minimumReleaseAge = $((cooldown_days * 86400))

[install.security]
scanner = "$scanner_dir/scanner.mjs"
EOF
# macOS without XDG_CONFIG_HOME reads ~/.bunfig.toml
if [ "$(uname)" = Darwin ] && [ "$config_home" = "$HOME/.config" ]; then
  ln -sfn ~/.config/.bunfig.toml ~/.bunfig.toml
fi

# 5. mise npm: tools go through aube, which uses the same scanner. Empty the value
# (securityScanner = "") to recover from a broken scanner
mkdir -p "$config_home/aube"
echo "securityScanner = \"$scanner_dir/scanner.mjs\"" >"$config_home/aube/config.toml"
if [ "$(uname)" = Darwin ]; then
  mkdir -p ~/Library/Application\ Support/aube
  ln -sfn "$config_home/aube/config.toml" ~/Library/Application\ Support/aube/config.toml
fi

# 6. npm: cooldown, and no install scripts, git or tarball deps unless approved
set_ini_key ~/.npmrc min-release-age $cooldown_days
set_ini_key ~/.npmrc strict-allow-scripts true
set_ini_key ~/.npmrc allow-git root
set_ini_key ~/.npmrc allow-remote root

# 7. pnpm: 10 reads ~/.config/pnpm/rc, 11+ reads config.yaml; write both
mkdir -p "$config_home/pnpm"
set_ini_key "$config_home/pnpm/rc" minimum-release-age $((cooldown_days * 1440))
set_ini_key "$config_home/pnpm/rc" trust-policy no-downgrade
set_yaml_key "$config_home/pnpm/config.yaml" minimumReleaseAge $((cooldown_days * 1440))
set_yaml_key "$config_home/pnpm/config.yaml" trustPolicy no-downgrade

# 8. uv (and mise pypi: tools)
mkdir -p "$config_home/uv"
uv_toml="$config_home/uv/uv.toml"
touch "$uv_toml"
if grep -q '^exclude-newer *=' "$uv_toml"; then
  sed -i.bak "s|^exclude-newer *=.*|exclude-newer = \"$cooldown_days days\"|" "$uv_toml" && rm -f "$uv_toml.bak"
else
  # Top-level keys must come before any [table]
  printf 'exclude-newer = "%s days"\n%s' "$cooldown_days" "$(cat "$uv_toml")" >"$uv_toml"
fi

# 9. Bundler cooldown exists from Bundler 4.0.13 on
if bundle --version &>/dev/null &&
  bun -e 'process.exit(Bun.semver.satisfies(process.argv[1], ">=4.0.13") ? 0 : 1)' "$(bundle --version | awk '{print $NF}')"; then
  bundle config set --global cooldown $cooldown_days
fi

# 10. Agent CLIs don't update themselves: they change only through `mise upgrade`
set_json ~/.claude/settings.json '.env.DISABLE_AUTOUPDATER = "1" | .env.DISABLE_UPDATES = "1"'
set_json ~/.copilot/config.json '.autoUpdate = false'
set_json ~/.gemini/settings.json '.general.enableAutoUpdate = false'
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

# 11. Aikido safe-chain is replaced by the guards above
if [ -d ~/.safe-chain ]; then
  mise exec npm:@aikidosec/safe-chain -- safe-chain teardown || true
  rm -rf ~/.safe-chain
fi
mise unuse -g npm:@aikidosec/safe-chain &>/dev/null || true
for rc in ~/.bashrc ~/.bash_profile ~/.zshrc; do
  if [ -f "$rc" ] && grep -q safe-chain "$rc"; then
    sed -i.bak '/safe-chain/d' "$rc" && rm -f "$rc.bak"
  fi
done

# 12. Prove it: every guard must block its test case
~/.local/bin/verify-supply-chain
