#!/bin/bash

# Native Discord app (Omarchy only includes Discord as a webapp)
green_text "Removing Discord webapp"
omarchy-webapp-remove Discord

green_text "Installing Discord"
source omarchy-sudo-keepalive
yay -S --noconfirm discord

green_text "Enabling PipeWire screen sharing"
echo "--enable-features=WebRTCPipeWireCapturer" > ~/.config/discord-flags.conf

green_text "Disabling Discord in-app update modal"
mkdir -p ~/.config/discord
settings_file=~/.config/discord/settings.json
if [ -f "$settings_file" ]; then
  python3 -c "
import json, sys
with open('$settings_file') as f: s = json.load(f)
s['SKIP_HOST_UPDATE'] = True
with open('$settings_file', 'w') as f: json.dump(s, f, indent=2)
"
else
  echo '{"SKIP_HOST_UPDATE": true}' > "$settings_file"
fi

green_text "Clearing stale Discord lock files"
rm -f ~/.config/discord/SingletonLock ~/.config/discord/SingletonSocket
