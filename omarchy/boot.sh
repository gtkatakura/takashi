#!/bin/bash
# shellcheck source=/dev/null

set -e

echo -e "Begin installation (or abort with ctrl+c)..."

# Omarchy should already have git installed, but ensure it's available
if ! command -v git &> /dev/null; then
  sudo pacman -S --noconfirm git >/dev/null
fi

echo "Cloning Takashi..."
rm -rf ~/.local/share/takashi
git clone https://github.com/gtkatakura/conventions-tips-tricks.git ~/.local/share/takashi >/dev/null

echo "Installation starting..."
source ~/.local/share/takashi/omarchy/install.sh
