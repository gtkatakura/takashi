#!/bin/bash

BINDINGS_FILE="$HOME/.config/hypr/bindings.lua"
DOFILE_LINE='dofile(os.getenv("HOME") .. "/.local/share/takashi/omarchy/defaults/hypr/numpad.lua")'

if grep -qF "$DOFILE_LINE" "$BINDINGS_FILE" 2>/dev/null; then
  green_text "Numpad workspace bindings already configured — skipping"
else
  green_text "Adding numpad workspace bindings to Hyprland"
  printf '\n-- Numpad workspace bindings (takashi)\n%s\n' "$DOFILE_LINE" >>"$BINDINGS_FILE"
fi
