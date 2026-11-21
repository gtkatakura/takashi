#!/bin/bash
# shellcheck source=/dev/null

set -e

echo -e "Begin installation (or abort with ctrl+c)..."

sudo apt update >/dev/null
sudo apt install -y git >/dev/null

# TAKASHI_REF picks a branch to install, e.g. to test a PR before it is merged
echo "Cloning Takashi (${TAKASHI_REF:-main})..."
rm -rf ~/.local/share/takashi
git clone -b "${TAKASHI_REF:-main}" https://github.com/gtkatakura/takashi.git ~/.local/share/takashi >/dev/null

echo "Installation starting..."
source ~/.local/share/takashi/ubuntu-24_04/install.sh
