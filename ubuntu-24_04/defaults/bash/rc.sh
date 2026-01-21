#!/bin/bash
# shellcheck source=/dev/null

source ~/.local/share/takashi/shared/defaults/bash/rc.sh

source ~/.local/share/takashi/ubuntu-24_04/defaults/bash/keyboard.sh
source ~/.local/share/takashi/ubuntu-24_04/defaults/bash/shell.sh

source ~/.local/share/takashi/ubuntu-24_04/defaults/bash/android.sh
source ~/.local/share/takashi/ubuntu-24_04/defaults/bash/brew.sh

source ~/.local/share/takashi/ubuntu-24_04/defaults/bash/dotnet.sh

source ~/.local/share/takashi/ubuntu-24_04/defaults/bash/mac.sh

# Fixes for AWS VPN Client
export DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1
