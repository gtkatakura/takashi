#!/bin/bash

# green_text "Fixing cedilla for GNOME"
# wget -qO- https://raw.githubusercontent.com/marcopaganini/gnome-cedilla-fix/master/fix-cedilla | bash

green_text "Setting keyboard sources"
gsettings set org.gnome.desktop.input-sources mru-sources "[('xkb', 'us'), ('xkb', 'us+alt-intl')]"
gsettings set org.gnome.desktop.input-sources sources "[('xkb', 'us'), ('xkb', 'us+alt-intl')]"

green_text "Setting keyboard switch command"
gsettings set org.gnome.desktop.input-sources xkb-options "['grp:alt_space_toggle', 'compose:caps']"
# grp:alt_shift_toggle: Switch layouts using Alt + Shift.
# grp:ctrl_shift_toggle: Switch layouts using Ctrl + Shift.
# grp:win_space_toggle: Switch layouts using Windows key + Space.
# grp:alt_space_toggle: Switch layouts using Alt + Space.
# grp:shift_toggle: Switch layouts using Shift.
