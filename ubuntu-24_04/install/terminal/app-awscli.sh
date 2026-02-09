#!/bin/bash

TEMP_DIR=$(mktemp -d)

green_text "Downloading AWS CLI (x86_64)"
wget -P "$TEMP_DIR" https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip

green_text "Unzipping AWS CLI (x86_64)"
unzip -q "$TEMP_DIR"/awscli-exe-linux-x86_64.zip -d "$TEMP_DIR"

green_text "Installing AWS CLI (x86_64)"
sudo "$TEMP_DIR"/aws/install --update
