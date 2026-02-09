#!/bin/bash

green_text "Installing mkcert"
sudo apt install mkcert -y

# The mkcert requires libnss3-tools to work with Firefox and Chromium-based browsers
# It's used to install the local CA in the browser trust stores
green_text "Installing libnss3"
sudo apt install libnss3-tools -y

