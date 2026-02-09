#!/bin/bash
# shellcheck source=/dev/null

# Exit immediately if a command exits with a non-zero status
set -e

source ~/.local/share/takashi/ubuntu-24_04/check-version.sh

source ~/.local/share/takashi/shared/defaults/bash/utils.sh

# Desktop software and tweaks will only be installed if we're running Gnome
RUNNING_GNOME=$([[ "$XDG_CURRENT_DESKTOP" == *"GNOME"* ]] && echo true || echo false)

if $RUNNING_GNOME; then
  # Ensure computer doesn't go to sleep or lock while installing
  gsettings set org.gnome.desktop.screensaver lock-enabled false
  gsettings set org.gnome.desktop.session idle-delay 0

  echo "Installing terminal and desktop tools.."
else
  echo "Only installing terminal tools..."
fi

# Install terminal tools
source ~/.local/share/takashi/shared/install/terminal.sh
source ~/.local/share/takashi/ubuntu-24_04/install/terminal.sh

if $RUNNING_GNOME; then
  # Install desktop tools and tweaks
  source ~/.local/share/takashi/ubuntu-24_04/install/desktop.sh

  # Revert to normal idle and lock settings
  gsettings set org.gnome.desktop.screensaver lock-enabled true
  gsettings set org.gnome.desktop.session idle-delay 300

  # Logout to pickup changes
  gum confirm "Ready to reboot for all settings to take effect?" && sudo reboot
fi
