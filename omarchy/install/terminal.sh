#!/bin/bash
# shellcheck source=/dev/null

if ! grep -Fxq 'source ~/.local/share/takashi/omarchy/defaults/bash/rc.sh' ~/.bashrc; then
  # Add the source line after the omarchy line in .bashrc
  omarchy_line=$(grep -n 'source ~/.local/share/omarchy/' ~/.bashrc | cut -d: -f1 | head -n1)

  if [ -n "$omarchy_line" ]; then
    sed -i "$((omarchy_line+1))isource ~/.local/share/takashi/omarchy/defaults/bash/rc.sh" ~/.bashrc
  else
    echo "Error: omarchy not found in .bashrc"
    exit 1
  fi
fi

# Run terminal installers
for installer in ~/.local/share/takashi/omarchy/install/terminal/*.sh; do source "$installer"; done
