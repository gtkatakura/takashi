#!/bin/bash

# Keyboard Configurations for:
# - Spectrum TC-602 (OEX)
# - Razer BlackWidow Ultimate 2016

function keyboard_code {
 setxkbmap -model pc105 -layout us -variant alt-intl,euro,
}

function keyboard_text {
 setxkbmap -model pc105 -layout us -variant intl
}

alias kc='keyboard_code'
alias kt='keyboard_text'
