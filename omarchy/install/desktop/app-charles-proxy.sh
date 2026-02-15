#!/bin/bash

# Charles 4 (not 5) — AUR 'charles' package is v5, so we install v4 manually
VERSION="4.6.8"

green_text "Downloading Charles Proxy $VERSION"
curl -L "https://www.charlesproxy.com/assets/release/$VERSION/charles-proxy-${VERSION}_amd64.tar.gz" -o /tmp/charles-proxy.tar.gz

green_text "Installing Charles Proxy $VERSION"
sudo mkdir -p /opt/charles
sudo tar -xzf /tmp/charles-proxy.tar.gz -C /opt/charles --strip-components=1

green_text "Creating symlink"
sudo ln -sf /opt/charles/bin/charles /usr/local/bin/charles

green_text "Creating desktop entry"
cat <<EOF | sudo tee /usr/share/applications/charles-proxy.desktop
[Desktop Entry]
Name=Charles Proxy
Exec=/opt/charles/bin/charles
Icon=/opt/charles/icon/charles_icon.svg
Type=Application
Categories=Network;Development;
Comment=HTTP proxy / HTTP monitor / Reverse Proxy
EOF

rm -f /tmp/charles-proxy.tar.gz

green_text "Charles Proxy $VERSION installed successfully!"
