#!/bin/bash
# shellcheck source=/dev/null

# Run terminal installers
for installer in ~/.local/share/takashi/shared/install/terminal/*.sh; do source "$installer"; done
