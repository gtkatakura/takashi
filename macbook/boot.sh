#!/bin/bash
# shellcheck source=/dev/null

set -e

echo -e "Begin installation (or abort with ctrl+c)..."

echo "Installing Homebrew..."
if ! command -v brew &> /dev/null; then
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  eval "$(/opt/homebrew/bin/brew shellenv)"
fi

echo "Installing git..."
if ! command -v git &> /dev/null; then
  brew install git
fi

echo "Cloning Takashi..."
rm -rf ~/.local/share/takashi
git clone https://github.com/gtkatakura/conventions-tips-tricks.git ~/.local/share/takashi >/dev/null

echo "Installation starting..."
source ~/.local/share/takashi/macbook/install.sh
