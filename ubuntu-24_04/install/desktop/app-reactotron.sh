#!/bin/bash

VERSION="3.7.0"
green_text "Downloading reactotron@${VERSION}"
wget -P /tmp "https://github.com/infinitered/reactotron/releases/download/reactotron-app%40${VERSION}/reactotron-app_${VERSION}_amd64.deb"

green_text "Installing reactotron"
sudo apt install /tmp/reactotron-app_${VERSION}_amd64.deb -y
