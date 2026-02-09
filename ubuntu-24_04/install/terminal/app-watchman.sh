#!/bin/bash

green_text "Installing Homebrew dependencies"
sudo apt install build-essential procps curl file git

green_text "Installing Homebrew"
curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh | bash

blue_text "Adding Homebrew to PATH"
eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"

green_text "Installing watchman"
brew install watchman
