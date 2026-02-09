#!/bin/bash

if [[ -n "$ZSH_VERSION" ]]; then
  COLOR_OFF="%f"
  GREEN="%F{green}"
  YELLOW="%F{yellow}"
  RED="%F{red}"
  BLUE="%F{blue}"
  NO_COLOR="%f"
else
  COLOR_OFF="\033[0m"
  GREEN="\033[0;32m"
  YELLOW="\033[0;33m"
  RED="\033[0;91m"
  BLUE="\033[0;34m"
  NO_COLOR="\033[0m"
fi

blue_text() {
  echo -e "${BLUE}$*${NO_COLOR}"
}

yellow_text() {
  echo -e "${YELLOW}$*${NO_COLOR}"
}

red_text() {
  echo -e "${RED}$*${NO_COLOR}"
}

green_text() {
  echo -e "${GREEN}$*${NO_COLOR}"
}