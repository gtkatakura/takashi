#!/bin/bash

blue_text "Adds GPG key (awsvpnclient)"
curl -fsSL https://d20adtppz83p9s.cloudfront.net/GTK/latest/debian-repo/awsvpnclient_public_key.asc | sudo gpg --dearmor -o /etc/apt/keyrings/awsvpnclient.gpg

blue_text "Setting up the repository (awsvpnclient)"
echo \
  "deb [arch=amd64 signed-by=/etc/apt/keyrings/awsvpnclient.gpg] https://d20adtppz83p9s.cloudfront.net/GTK/latest/debian-repo ubuntu main" \
  | sudo tee /etc/apt/sources.list.d/awsvpnclient.list > /dev/null

green_text "Installing awsvpnclient (using apt)"
sudo apt update
sudo apt install awsvpnclient -y

# Fixes for Ubuntu 24.04
# https://gist.github.com/thiagozs/4d8c6e090a027fae3dd883163615f91e
wget -P /tmp http://archive.ubuntu.com/ubuntu/pool/main/o/openssl/libssl1.1_1.1.0g-2ubuntu4_amd64.deb
sudo dpkg -i /tmp/libssl1.1_1.1.0g-2ubuntu4_amd64.deb

blue_text "Creates awsvpnclient symbolick link"
cd /opt/awsvpnclient || exit
sudo ln -s AWS\ VPN\ Client awsvpnclient
cd - || exit

blue_text "Patching /etc/systemd/system/awsvpnclient.service"
cat <<EOF | sudo tee /etc/systemd/system/awsvpnclient.service
[Service]
Type=simple
ExecStart=/opt/awsvpnclient/Service/ACVC.GTK.Service
Restart=always
RestartSec=1s
User=root
Environment=DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1

[Install]
WantedBy=multi-user.target
EOF

blue_text "Patching /usr/share/applications/awsvpnclient.desktop"
cat <<EOF | sudo tee /usr/share/applications/awsvpnclient.desktop
[Desktop Entry]
Type=Application
Encoding=UTF-8
Name=AWS VPN Client
Comment=AWS VPN Client
Exec=/opt/awsvpnclient/awsvpnclient %U
Path=/opt/awsvpnclient
Icon=acvc-64
Terminal=false
Categories=Network;VPN;
Keywords=vpn;aws;
EOF
