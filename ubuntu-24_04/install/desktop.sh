#!/bin/bash
# shellcheck source=/dev/null

# Ensure computer doesn't go to sleep or lock while installing
gsettings set org.gnome.desktop.screensaver lock-enabled false
gsettings set org.gnome.desktop.session idle-delay 0

# Run desktop installers
for installer in ~/.local/share/takashi/ubuntu-24_04/install/desktop/*.sh; do source "$installer"; done

# Revert to normal idle and lock settings
gsettings set org.gnome.desktop.screensaver lock-enabled true
gsettings set org.gnome.desktop.session idle-delay 300
