#!/bin/bash

# Switch between the layouts set in omarchy/defaults/hypr/keyboard.lua (also toggled with Alt+Space)
function keyboard_code {
  hyprctl switchxkblayout all 0 >/dev/null
}

function keyboard_text {
  hyprctl switchxkblayout all 1 >/dev/null
}

alias kc='keyboard_code'
alias kt='keyboard_text'
