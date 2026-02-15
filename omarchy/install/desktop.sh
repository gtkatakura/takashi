#!/bin/bash
# shellcheck source=/dev/null

# Run desktop installers
for installer in ~/.local/share/takashi/omarchy/install/desktop/*.sh; do source "$installer"; done
