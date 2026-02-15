#!/bin/bash

# gum is already provided by Omarchy (omarchy-base.packages)

green_text "Installing glow (using pacman)"
sudo pacman -S --noconfirm glow

green_text "Installing Charm tools (using yay)"
yay -S --noconfirm freeze-bin mods vhs-bin

green_text "Installing sequin (using go install)"
go install github.com/charmbracelet/sequin@latest
