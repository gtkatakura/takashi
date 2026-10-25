#!/bin/bash

INPUT_FILE="$HOME/.config/hypr/input.lua"
DOFILE_LINE='dofile(os.getenv("HOME") .. "/.local/share/takashi/omarchy/defaults/hypr/keyboard.lua")'

if grep -qF "$DOFILE_LINE" "$INPUT_FILE" 2>/dev/null; then
  green_text "Keyboard layouts already configured — skipping"
else
  green_text "Adding keyboard layouts (us + us intl, Alt+Space) to Hyprland"
  printf '\n-- Keyboard layouts (takashi)\n%s\n' "$DOFILE_LINE" >>"$INPUT_FILE"
fi
