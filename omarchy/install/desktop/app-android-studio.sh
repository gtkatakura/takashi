#!/bin/bash

# https://reactnative.dev/docs/set-up-your-environment
# https://developer.android.com/studio/run/emulator-acceleration

# Use JetBrains Toolbox to install Android Studio

green_text "Installing qemu-full for Android emulation (using pacman)"
sudo pacman -S --noconfirm qemu-full libvirt virt-manager

blue_text "Adding user to kvm group"
sudo usermod -aG kvm "$USER"
