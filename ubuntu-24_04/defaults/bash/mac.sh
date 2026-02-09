#!/bin/bash

function mac() {
  (alacritty \
    --config-file="/home/$USER/.local/share/takashi/ubuntu-24_04/defaults/alacritty/mac.toml" \
    --title="Mac OS (SSH)" \
    --command ssh mac > /dev/null 2>&1 &)
}
