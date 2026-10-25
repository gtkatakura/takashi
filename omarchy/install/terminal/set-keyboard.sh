#!/bin/bash

INPUT_FILE="$HOME/.config/hypr/input.lua"
# Guarded so Hyprland's config keeps loading if takashi is ever removed
DOFILE_LINE='do local f = os.getenv("HOME") .. "/.local/share/takashi/omarchy/defaults/hypr/keyboard.lua"; local h = io.open(f, "r"); if h then h:close(); dofile(f) end end'

if grep -qF "$DOFILE_LINE" "$INPUT_FILE" 2>/dev/null; then
  green_text "Keyboard layouts already configured — skipping"
else
  green_text "Adding keyboard layouts (us + us intl, Alt+Space) to Hyprland"
  printf '\n-- Keyboard layouts (takashi)\n%s\n' "$DOFILE_LINE" >>"$INPUT_FILE"
fi
