#!/bin/bash

sudo apt remove --purge -y brave-browser
sudo rm /etc/apt/sources.list.d/brave-browser.list
sudo rm /etc/apt/keyrings/brave-browser.gpg

# sudo rm -rf ~/.config/BraveSoftware/Brave-Browser