#!/bin/bash

# https://www.onorca.dev — official AppImage; kept in a user-writable dir so it can self-update
ORCA_DIR="$HOME/.local/share/orca"

# Orca updates itself, so only download it on the first install
if [ ! -x "$ORCA_DIR/orca.AppImage" ]; then
  green_text "Downloading Orca (AppImage)"
  mkdir -p "$ORCA_DIR"
  curl -fL "https://github.com/stablyai/orca/releases/latest/download/orca-linux.AppImage" -o "$ORCA_DIR/orca.AppImage"
  chmod +x "$ORCA_DIR/orca.AppImage"
fi

green_text "Extracting Orca icon"
(cd "$ORCA_DIR" && rm -rf squashfs-root &&
  ./orca.AppImage --appimage-extract 'usr/share/icons/hicolor/512x512/apps/orca-ide.png' >/dev/null &&
  cp squashfs-root/usr/share/icons/hicolor/512x512/apps/orca-ide.png icon.png && rm -rf squashfs-root)

green_text "Creating Orca desktop entry"
cat >"$HOME/.local/share/applications/orca.desktop" <<DESKTOP
[Desktop Entry]
Name=Orca
Comment=Agent development environment
Exec=$ORCA_DIR/orca.AppImage %U
Icon=$ORCA_DIR/icon.png
Type=Application
Categories=Development;
DESKTOP
update-desktop-database "$HOME/.local/share/applications" &>/dev/null || true
