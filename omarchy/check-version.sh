#!/bin/bash
# shellcheck source=/dev/null

if [ ! -f /etc/os-release ]; then
  echo "$(tput setaf 1)Error: Unable to determine OS. /etc/os-release file not found."
  echo "Installation stopped."
  exit 1
fi

source /etc/os-release

# Check if running on Omarchy 4+ (which reports itself as ID=omarchy, ID_LIKE=arch)
if [ "$ID" != "omarchy" ]; then
  echo "$(tput setaf 1)Error: OS requirement not met"
  echo "You are currently running: $ID $VERSION_ID"
  echo "OS required: Omarchy 4+"
  echo "Visit https://omarchy.org for installation instructions."
  echo "Installation stopped."
  exit 1
fi

# Check if running on x86_64
ARCH=$(uname -m)
if [ "$ARCH" != "x86_64" ]; then
  echo "$(tput setaf 1)Error: Unsupported architecture detected"
  echo "Current architecture: $ARCH"
  echo "This installation is only supported on x86_64."
  echo "Installation stopped."
  exit 1
fi
