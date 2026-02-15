#!/bin/bash

# Omarchy installs JetBrains Toolbox during first-run, but this ensures it's available
green_text "Installing JetBrains Toolbox (using yay)"
yay -S --noconfirm jetbrains-toolbox
