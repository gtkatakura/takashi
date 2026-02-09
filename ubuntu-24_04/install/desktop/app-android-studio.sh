#!/bin/bash

# https://reactnative.dev/docs/set-up-your-environment
# https://developer.android.com/studio/run/emulator-acceleration?hl=pt-br#vm-linux

# Use JetBrains Toolbox to install Android Studio

# ref: https://absprog.com/post/qemu-kvm-ubuntu-24-04
green_text "Installing qemu-kvm (using apt)"
sudo apt install qemu-kvm libvirt-daemon-system libvirt-clients virt-manager -y

blue_text "Adding user to kvm group"
sudo adduser "$USER" kvm