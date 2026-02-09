#!/bin/bash

blue_text "Setting up the repository (vysor)"
echo \
  "deb [arch=$(dpkg --print-architecture), trusted=yes] https://nuts.vysor.io/apt ./" \
  | sudo tee /etc/apt/sources.list.d/vysor.list > /dev/null

green_text "Installing vysor"
sudo apt update
sudo apt install vysor -y
