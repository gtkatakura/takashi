#!/bin/bash

# File system
if command -v eza &> /dev/null; then
  alias ls='eza -lh --group-directories-first'
  alias lsa='ls -a'
  alias lt='eza --tree --level=2 --long --git'
  alias lta='lt -a'
fi

if command -v fzf &> /dev/null; then
  alias ff="fzf --preview 'bat --style=numbers --color=always {}'"
fi

if command -v zoxide &> /dev/null; then
  alias cd='z'
fi

# Directories
alias ..='cd ..'
alias ...='cd ../..'
alias ....='cd ../../..'

# Tools
n() { if [ "$#" -eq 0 ]; then nvim .; else nvim "$@"; fi; }
alias g='git'
alias d='docker'
alias lzg='lazygit'
alias lzd='lazydocker'
