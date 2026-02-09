#!/bin/bash

green_text "Installing Comby dependencies"
sudo apt install libpcre3-dev libev4 -y

green_text "Installing Comby"
bash <(curl -sL get.comby.dev)
