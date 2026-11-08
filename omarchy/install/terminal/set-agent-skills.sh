#!/bin/bash

# Skills, slash commands, agents and global instructions for coding agents (shared/defaults/agents).
# Skills are copied into ~/.agents/skills for opencode and ~/.claude/skills for Claude Code;
# commands, agents, AGENTS.md and the opencode overlay are symlinks and update with this repo.
agents_src=~/.local/share/takashi/shared/defaults/agents
opencode_dir=~/.config/opencode

green_text "Installing agent skills"

# Omarchy declares node in its mise tools: run the skills CLI through it rather than a
# pacman nodejs, which would shadow mise's node (/usr/bin comes first on Omarchy's PATH)
skills_cli() { mise exec node -- npx -y skills "$@"; }

# bun runs the git-watch-commits helper
command -v bun &>/dev/null || mise use -g bun@latest

skill_agents=(-a opencode -a claude-code)

# Own skills: re-run this script after editing one (they are copies)
skills_cli add "$agents_src/skills" -g "${skill_agents[@]}" -s '*' -y --copy

# Third-party skills, each pinned to an upstream commit: one install per source and commit
jq -r '.skills | to_entries | group_by(.value.source + "#" + .value.ref)[]
  | "\(.[0].value.source)#\(.[0].value.ref) \(map(.key) | join(" "))"' "$agents_src/skills-lock.json" |
  while read -r source names; do
    # shellcheck disable=SC2086
    skills_cli add "$source" -g "${skill_agents[@]}" -s $names -y --copy </dev/null
  done

# Link a file this repo owns; never replace a real file or someone else's symlink
link_agent_file() {
  local src=$1 dest=$2
  mkdir -p "$(dirname "$dest")"
  if [ -e "$dest" ] && [ ! -L "$dest" ]; then
    yellow_text "Skipping $dest: a real file is already there"
  elif [ -L "$dest" ] && [[ "$(readlink "$dest")" != "$agents_src"/* ]]; then
    yellow_text "Skipping $dest: it links somewhere else ($(readlink "$dest"))"
  else
    ln -sfn "$src" "$dest"
  fi
}

green_text "Linking opencode commands, agents and global instructions"
for prompt in "$agents_src"/prompts/*.md; do link_agent_file "$prompt" "$opencode_dir/commands/$(basename "$prompt")"; done
for agent in "$agents_src"/opencode/agents/*.md; do link_agent_file "$agent" "$opencode_dir/agents/$(basename "$agent")"; done
link_agent_file "$agents_src/AGENTS.md" "$opencode_dir/AGENTS.md"
link_agent_file "$agents_src/opencode/opencode.jsonc" "$opencode_dir/opencode.jsonc"
