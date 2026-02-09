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

brew install --cask brave-browser
brew install --cask google-chrome
brew install --cask firefox

brew install --cask alacritty
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
brew install gnupg
brew install gh
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
