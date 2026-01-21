#!/bin/bash

green_text "Fetching Cursor download information"
cursor_info=$(
  curl -sL 'https://www.cursor.com/api/download?platform=linux-x64&releaseTrack=stable' \
    -H 'content-type: application/json'
)

cursor_deb_url=$(echo "$cursor_info" | jq -r '.debUrl')
cursor_version=$(echo "$cursor_info" | jq -r '.version')

green_text "Downloading Cursor .deb package (version $cursor_version)"
deb_file="/tmp/cursor_${cursor_version}_amd64.deb"
curl -L "$cursor_deb_url" -o "$deb_file"

green_text "Installing Cursor .deb package"
sudo dpkg -i "$deb_file" || sudo apt-get install -f -y

green_text "Cleaning up temporary file"
rm -f "$deb_file"

green_text "Cursor installed successfully!"
