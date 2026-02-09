#!/bin/bash

# Enable GNOME extensions
gnome-extensions enable ubuntu-appindicators@ubuntu.com

# Configure Tactile
# gsettings list-keys org.gnome.shell.extensions.tactile
gsettings set org.gnome.shell.extensions.tactile col-0 1
gsettings set org.gnome.shell.extensions.tactile col-1 1
gsettings set org.gnome.shell.extensions.tactile col-2 1
gsettings set org.gnome.shell.extensions.tactile col-3 1
gsettings set org.gnome.shell.extensions.tactile gap-size 0

# Disable <Super>P to switch monitor
gsettings set org.gnome.mutter.keybindings switch-monitor "['XF86Display']"

# Use super for workspaces
# Preference for the numpad keys
gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-1 "['<Super>KP_1']"
gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-2 "['<Super>KP_2']"
gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-3 "['<Super>KP_3']"
gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-4 "['<Super>KP_4']"
gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-5 "['<Super>KP_5']"
gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-6 "['<Super>KP_6']"

# Configure TopHat
# gsettings list-keys org.gnome.shell.extensions.tophat
gsettings set org.gnome.shell.extensions.tophat show-icons true
gsettings set org.gnome.shell.extensions.tophat show-cpu true
gsettings set org.gnome.shell.extensions.tophat cpu-display numeric
gsettings set org.gnome.shell.extensions.tophat show-disk true
gsettings set org.gnome.shell.extensions.tophat show-mem true
gsettings set org.gnome.shell.extensions.tophat mem-display numeric
gsettings set org.gnome.shell.extensions.tophat network-usage-unit bits

# Install new extensions
gext install openweather-extension@jenslody.de

# Configure favorite apps
gsettings set org.gnome.shell favorite-apps \
  "['brave-browser.desktop', \
    'Alacritty.desktop', \
    'cursor.desktop', \
    'spotify.desktop', \
    'io.dbeaver.DBeaverCommunity.desktop', \
    'Zoom.desktop', \
    'md.obsidian.Obsidian.desktop', \
    'Activity.desktop', \
    'Docker.desktop', \
    'Omakub.desktop', \
    '1password.desktop', \
    'org.gnome.Settings.desktop', \
    'org.gnome.Nautilus.desktop', \
    'localsend_app.desktop']"
