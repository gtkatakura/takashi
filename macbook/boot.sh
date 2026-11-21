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

# TAKASHI_REF picks a branch to install, e.g. to test a PR before it is merged
echo "Cloning Takashi (${TAKASHI_REF:-main})..."
rm -rf ~/.local/share/takashi
git clone -b "${TAKASHI_REF:-main}" https://github.com/gtkatakura/takashi.git ~/.local/share/takashi >/dev/null

echo "Installation starting..."
source ~/.local/share/takashi/macbook/install.sh
