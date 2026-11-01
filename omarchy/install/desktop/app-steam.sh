#!/bin/bash

STEAM_APP=com.valvesoftware.Steam
APPLICATIONS="$HOME/.local/share/applications"

green_text "Installing Steam (Flatpak)"
omarchy-pkg-add flatpak
flatpak remote-add --user --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
# Guarded so a re-run never updates a Steam that may be running
flatpak info --user "$STEAM_APP" &>/dev/null || flatpak install --user -y --noninteractive flathub "$STEAM_APP"

green_text "Adding steam-account"
mkdir -p "$HOME/.local/bin"
ln -sf "$HOME/.local/share/takashi/omarchy/defaults/bin/steam-account" "$HOME/.local/bin/steam-account"

# The default Flatpak Steam is the labs account: same desktop id, so this shadows the Flatpak export
green_text "Creating Steam desktop entries"
sed 's/^Name=Steam$/Name=Steam - labs/' "$HOME/.local/share/flatpak/exports/share/applications/$STEAM_APP.desktop" \
  >"$APPLICATIONS/$STEAM_APP.desktop"

# Not copied from the export: its actions would open the labs Steam
for account in jarvis vision; do
  mkdir -p "$HOME/.steam-accounts/$account"
  cat >"$APPLICATIONS/steam-$account.desktop" <<DESKTOP
[Desktop Entry]
Name=Steam - $account
Comment=Steam on the $account account
Exec=$HOME/.local/bin/steam-account $account
Icon=$STEAM_APP
Type=Application
Categories=Game;
DESKTOP
done
update-desktop-database "$APPLICATIONS" &>/dev/null || true
