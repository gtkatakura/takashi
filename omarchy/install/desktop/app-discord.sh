#!/bin/bash

# Native Discord app (Omarchy only includes Discord as a webapp)
green_text "Removing Discord webapp"
omarchy-webapp-remove Discord

green_text "Installing Discord (using AUR - discord_arch_electron)"
yay -S --noconfirm discord_arch_electron
