#!/bin/bash
# shellcheck source=/dev/null

# Exit immediately if a command exits with a non-zero status
set -e

source ~/.local/share/takashi/omarchy/check-version.sh

source ~/.local/share/takashi/shared/defaults/bash/utils.sh

echo "Installing terminal and desktop tools..."

# Install terminal tools
source ~/.local/share/takashi/shared/install/terminal.sh
source ~/.local/share/takashi/omarchy/install/terminal.sh

# Install desktop tools
source ~/.local/share/takashi/omarchy/install/desktop.sh

# Optional reboot
gum confirm "Ready to reboot for all settings to take effect?" && sudo reboot
