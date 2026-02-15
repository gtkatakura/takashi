#!/bin/bash

green_text "Installing VirtualBox (using pacman)"
sudo pacman -S --noconfirm virtualbox virtualbox-host-modules-arch
