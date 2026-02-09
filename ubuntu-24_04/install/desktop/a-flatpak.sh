#!/bin/bash

green_text "Adding flathub to flatpak"
flatpak remote-add flathub https://flathub.org/repo/flathub.flatpakrepo --user --if-not-exists