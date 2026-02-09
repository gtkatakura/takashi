#!/bin/bash

blue_text "Adding quickemu repository"
sudo apt-add-repository ppa:flexiondotorg/quickemu -y

green_text "Installing quickemu"
sudo apt install quickemu -y

green_text "Installing quickgui"
sudo apt install quickgui -y
