#!/bin/bash

green_text "Installing quickemu"
# quickgui-bin: the source build needs Flutter, whose AUR package lags the repo's dart
omarchy-pkg-aur-add quickemu quickgui-bin
