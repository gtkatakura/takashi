#!/bin/bash

BINDINGS_FILE="$HOME/.config/hypr/bindings.conf"
SOURCE_LINE="source = ~/.config/hypr/bindings-numpad.conf"

if grep -qF "$SOURCE_LINE" "$BINDINGS_FILE" 2>/dev/null; then
  green_text "Numpad workspace bindings already configured — skipping"
  return 0
fi

green_text "Adding numpad workspace bindings to Hyprland"

cp "$(dirname "$0")/../../defaults/hypr/bindings/numpad.conf" "$HOME/.config/hypr/bindings-numpad.conf"
echo "" >> "$BINDINGS_FILE"
echo "$SOURCE_LINE" >> "$BINDINGS_FILE"
