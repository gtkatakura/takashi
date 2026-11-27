#!/bin/bash
# shellcheck source=/dev/null

# Exit immediately if a command exits with a non-zero status
set -e

if [ ! -f ~/.bash_profile ]; then
  touch ~/.bash_profile
fi

if ! grep -Fxq 'source ~/.local/share/takashi/macbook/defaults/bash/rc.sh' ~/.bash_profile; then
  echo "source ~/.local/share/takashi/macbook/defaults/bash/rc.sh" >> ~/.bash_profile
fi

brew install --cask raycast
brew install --cask superwhisper

# Tiling window manager in the style of Hyprland, so the Mac is driven like the Omarchy desktop.
# It asks for the Accessibility permission on first launch (MANUAL_SETUP.md)
brew install --cask hyprmac

brew install --cask brave-browser
brew install --cask google-chrome
brew install --cask firefox

brew install --cask ghostty

ghostty_config=~/.config/ghostty/config
ghostty_import='config-file = ~/.local/share/takashi/macbook/defaults/ghostty/config'

mkdir -p ~/.config/ghostty

if ! grep -Fq 'takashi/macbook/defaults/ghostty/config' "$ghostty_config" 2>/dev/null; then
  if [ -f "$ghostty_config" ]; then
    tmp=$(mktemp)
    echo "$ghostty_import" | cat - "$ghostty_config" > "$tmp"
    mv "$tmp" "$ghostty_config"
  else
    echo "$ghostty_import" > "$ghostty_config"
  fi
fi

brew install --cask cursor
brew install --cask visual-studio-code

brew install --cask dbeaver-community

brew install --cask discord
brew install --cask slack
brew install --cask zoom
brew install --cask figma

brew install --cask spotify
brew install --cask obsidian
brew install --cask notion
brew install --cask 1password-cli

brew install watchman
brew install --cask android-studio
brew install --cask android-platform-tools
brew install --cask vysor
brew install --cask expo-orbit

brew install --cask aws-vpn-client

brew install jq
brew install yq
brew install eza
brew install fzf
brew install zoxide
brew install docker
brew install docker-compose
brew install orbstack
brew install mise

# Shared setup, which puts the dependency-download guards in place, runs before mise installs anything
source ~/.local/share/takashi/shared/install/terminal.sh

mise use -g bun@latest

# Coding agents, through mise like on Omarchy, which keeps them at the latest version.
# node first: opencode comes from npm. --yes accepts the build scripts opencode's package asks to run
mise use -g node@latest
mise use -g --yes claude@latest codex@latest gemini@latest pi@latest oh-my-pi@latest opencode@latest
brew install gnupg
brew install gh
brew install rtk
brew install ccusage
brew install lazygit
brew install lazydocker

sudo softwareupdate --instal-rosetta

brew install charmbracelet/tap/crush
brew install charmbracelet/tap/freeze
brew install charmbracelet/tap/glow
brew install charmbracelet/tap/mods
brew install charmbracelet/tap/sequin
brew install charmbracelet/tap/vhs

# Benchmarking tool
brew install hyperfine

# Color manipulation CLI
brew install pastel
