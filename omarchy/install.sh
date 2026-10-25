#!/bin/bash
# shellcheck source=/dev/null

# Exit immediately if a command exits with a non-zero status
set -e

source ~/.local/share/takashi/omarchy/check-version.sh

source ~/.local/share/takashi/shared/defaults/bash/utils.sh

# Ask for sudo once and keep it alive through long downloads and AUR installs
source omarchy-sudo-keepalive

# A fresh Omarchy (installed offline from the ISO) has no pacman sync databases yet,
# and installing on top of an out-of-date system risks partial upgrades: update first
omarchy-update -y

echo "Installing terminal and desktop tools..."

# Install terminal tools
source ~/.local/share/takashi/shared/install/terminal.sh
source ~/.local/share/takashi/omarchy/install/terminal.sh

# Install desktop tools
source ~/.local/share/takashi/omarchy/install/desktop.sh

# Review leftover build dependencies and -debug packages from AUR installs
omarchy-update-orphan-pkgs

# Optional reboot
if gum confirm "Ready to reboot for all settings to take effect?"; then
  sudo reboot
fi
