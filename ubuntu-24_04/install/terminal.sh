#!/bin/bash
# shellcheck source=/dev/null

sudo apt update -y

if ! grep -Fxq 'source ~/.local/share/takashi/ubuntu-24_04/defaults/bash/rc.sh' ~/.bashrc; then
  # Add the source line after the omakub line in .bashrc
  omakub_line=$(grep -n 'source ~/.local/share/omakub/' ~/.bashrc | cut -d: -f1 | head -n1)

  if [ -n "$omakub_line" ]; then
    sed -i "$((omakub_line+1))isource ~/.local/share/takashi/ubuntu-24_04/defaults/bash/rc.sh" ~/.bashrc
  else
    echo "Error: omakub not found in .bashrc"
    exit 1
  fi
fi

# Run terminal installers
for installer in ~/.local/share/takashi/ubuntu-24_04/install/terminal/*.sh; do source "$installer"; done
