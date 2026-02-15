#!/bin/bash

# Keyboard configuration for Hyprland
#
# This sets the keyboard layouts at runtime via hyprctl.
# For persistent config, add this to ~/.config/hypr/hyprland.conf:
#
#   input {
#     kb_layout = us,us
#     kb_variant = ,intl
#     kb_options = grp:alt_space_toggle
#   }

if command -v hyprctl &>/dev/null && hyprctl monitors &>/dev/null 2>&1; then
  green_text "Setting keyboard layouts for Hyprland"
  hyprctl keyword input:kb_layout "us,us"
  hyprctl keyword input:kb_variant ",intl"
  hyprctl keyword input:kb_options "grp:alt_space_toggle"
else
  yellow_text "Hyprland not running — skipping keyboard setup (configure manually in hyprland.conf)"
fi
