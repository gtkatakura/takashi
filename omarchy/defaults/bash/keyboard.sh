#!/bin/bash

# Keyboard layout switching for Hyprland
#
# Persistent config should be set in ~/.config/hypr/hyprland.conf:
#
#   input {
#     kb_layout = us,us
#     kb_variant = ,intl
#     kb_options = grp:alt_space_toggle
#   }
#
# These functions switch layouts at runtime:

function keyboard_code {
  hyprctl keyword input:kb_layout "us"
  hyprctl keyword input:kb_variant ""
}

function keyboard_text {
  hyprctl keyword input:kb_layout "us"
  hyprctl keyword input:kb_variant "intl"
}

alias kc='keyboard_code'
alias kt='keyboard_text'
