#!/bin/bash

STEAM_APP=com.valvesoftware.Steam
DATA_HOME="${XDG_DATA_HOME:-$HOME/.local/share}"
APPLICATIONS="$DATA_HOME/applications"

green_text "Installing Steam (Flatpak)"
omarchy-pkg-add flatpak
flatpak remote-add --user --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
# Guarded so a re-run never updates a Steam that may be running
flatpak info --user "$STEAM_APP" &>/dev/null || flatpak install --user -y --noninteractive flathub "$STEAM_APP"

green_text "Adding steam-account"
mkdir -p "$HOME/.local/bin" "$APPLICATIONS"
ln -sf "$HOME/.local/share/takashi/omarchy/defaults/bin/steam-account" "$HOME/.local/bin/steam-account"

# The default Flatpak Steam is the labs account: same desktop id, so this shadows the Flatpak export.
# Only the first Exec goes through steam-account: the ones after it are the actions, which stay on labs
green_text "Creating the labs Steam desktop entry"
tmp=$(mktemp)
sed -e 's/^Name=Steam$/Name=Steam - labs/' \
  -e "0,/^Exec=/s|^Exec=.*|Exec=$HOME/.local/bin/steam-account labs %U|" \
  "$DATA_HOME/flatpak/exports/share/applications/$STEAM_APP.desktop" >"$tmp"
mv "$tmp" "$APPLICATIONS/$STEAM_APP.desktop"
update-desktop-database "$APPLICATIONS" &>/dev/null || true
