#!/bin/bash

# One entry point for every machine:
#
#   bash <(curl -fsSL setup.gtkatakura.com)
#
# It finds out which system it is running on and hands over to that system's own boot.sh, which checks
# the version, clones this repository and installs. TAKASHI_REF picks a branch, e.g. to test a PR.

set -e

platform=""

case "$(uname -s)" in
  Darwin)
    platform=macbook
    ;;
  Linux)
    # In a subshell: os-release sets NAME, VERSION and others, which must not leak into the install
    id=$([ -f /etc/os-release ] && . /etc/os-release && echo "$ID" || true)
    case "$id" in
      omarchy) platform=omarchy ;;
    esac
    ;;
esac

if [ -z "$platform" ]; then
  echo "No setup for this system: $(uname -s)${id:+ ($id)}."
  echo "Supported: Omarchy 4+ (https://omarchy.org) and macOS."
  exit 1
fi

ref=${TAKASHI_REF:-main}
url="https://raw.githubusercontent.com/gtkatakura/takashi/$ref/$platform/boot.sh"

boot=$(curl -fsSL "$url")

echo "Detected $platform. Running its setup from takashi ($ref)..."
bash <(echo "$boot")
