#!/bin/bash
# shellcheck source=/dev/null

set -e

echo -e "Begin installation (or abort with ctrl+c)..."

sudo apt update >/dev/null
sudo apt install -y git >/dev/null

echo "Cloning Takashi..."
rm -rf ~/.local/share/takashi
git clone https://github.com/gtkatakura/conventions-tips-tricks.git ~/.local/share/takashi >/dev/null

echo "Installation starting..."
source ~/.local/share/takashi/ubuntu-24_04/install.sh
