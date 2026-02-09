#!/bin/bash

blue_text "Installing AppImage dependencies"
sudo add-apt-repository universe -y
sudo apt install libfuse2t64

# https://github.com/electron/electron/issues/42510#issuecomment-2171583086
blue_text "Configuring AppImage dependencies"
sudo sysctl -w kernel.apparmor_restrict_unprivileged_userns=0

green_text "Downloading LM Studio (AppImage)"
sudo curl -L "https://installers.lmstudio.ai/linux/x64/0.3.23-3/LM-Studio-0.3.23-3-x64.AppImage" -o /opt/lm-studio.appimage
sudo chmod +x /opt/lm-studio.appimage

green_text "Creating the desktop shortcut"
sudo touch /usr/share/applications/lm-studio.desktop

green_text "Configuring the desktop shortcut"
cat <<EOF | sudo tee /usr/share/applications/lm-studio.desktop
[Desktop Entry]
Name=LM Studio
Exec=/opt/lm-studio.appimage --no-sandbox %U
Icon=/home/$USER/.local/share/takashi/ubuntu-24_04/applications/icons/lm-studio.png
Type=Application
Categories=Development;
EOF
