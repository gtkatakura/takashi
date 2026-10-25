#!/bin/bash
# shellcheck source=/dev/null

set -e

echo -e "Begin installation (or abort with ctrl+c)..."

# Omarchy should already have git installed, but ensure it's available
if ! command -v git &> /dev/null; then
  sudo pacman -S --noconfirm git >/dev/null
fi

# TAKASHI_REF picks a branch to install, e.g. to test a PR before it is merged
echo "Cloning Takashi (${TAKASHI_REF:-main})..."
rm -rf ~/.local/share/takashi
git clone -b "${TAKASHI_REF:-main}" https://github.com/gtkatakura/takashi.git ~/.local/share/takashi >/dev/null

echo "Installation starting..."
source ~/.local/share/takashi/omarchy/install.sh
