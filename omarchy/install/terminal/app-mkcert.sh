#!/bin/bash

# nss replaces libnss3-tools from Ubuntu
green_text "Installing mkcert (using pacman)"
sudo pacman -S --noconfirm mkcert nss
