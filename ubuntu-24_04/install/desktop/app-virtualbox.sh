#!/bin/bash

green_text "Installing prerequisites for virtualbox"
sudo apt install -y software-properties-common apt-transport-https wget

green_text "Installing virtualbox (using apt)"
sudo apt install -y virtualbox
