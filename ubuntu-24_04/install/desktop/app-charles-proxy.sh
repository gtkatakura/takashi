#!/bin/bash

# https://www.charlesproxy.com/documentation/installation/apt-repository/

blue_text "Adds GPG key (charles-proxy)"
curl -fsSL https://www.charlesproxy.com/packages/apt/charles-repo.asc | sudo gpg --dearmor -o /etc/apt/keyrings/charles-proxy.gpg

blue_text "Setting up the repository (charles-proxy)"
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/charles-proxy.gpg] https://www.charlesproxy.com/packages/apt/ charles-proxy main" \
  | sudo tee /etc/apt/sources.list.d/charles-proxy.list > /dev/null

green_text "Installing charles-proxy"
sudo apt update
sudo apt install charles-proxy -y
