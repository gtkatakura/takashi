#!/bin/bash

# https://brave.com/linux

blue_text "Adds GPG key (brave-browser)"
curl -fsSL https://brave-browser-apt-release.s3.brave.com/brave-browser-archive-keyring.gpg | sudo gpg --dearmor -o /etc/apt/keyrings/brave-browser.gpg

blue_text "Setting up the repository (brave-browser)"
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/brave-browser.gpg] https://brave-browser-apt-release.s3.brave.com stable main" \
  | sudo tee /etc/apt/sources.list.d/brave-browser.list > /dev/null

green_text "Installing brave-browser"
sudo apt update
sudo apt install brave-browser -y
