#!/bin/bash

temp_dir=$(mktemp -d)

blue_text "Downloading JetBrains Toolbox"
curl -sSL https://download.jetbrains.com/toolbox/jetbrains-toolbox-2.5.3.37797.tar.gz | tar -xz -C "$temp_dir"

green_text "Installing JetBrains Toolbox"
cd "$temp_dir"/jetbrains-toolbox-2.5.3.37797 && ./jetbrains-toolbox
