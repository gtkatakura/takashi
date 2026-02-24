#!/bin/bash
# shellcheck source=/dev/null

if [ -n "$ZSH_VERSION" ]; then
  autoload -Uz compinit && compinit
fi

if command -v mise &> /dev/null; then
  eval "$(mise activate bash)"
fi

if command -v fzf &> /dev/null; then
  if [ -n "$ZSH_VERSION" ]; then
    eval "$(fzf --zsh)"
  elif [ -n "$BASH_VERSION" ]; then
    eval "$(fzf --bash)"
  fi
fi

if command -v zoxide &> /dev/null; then
  if [ -n "$ZSH_VERSION" ]; then
    eval "$(zoxide init zsh)"
  elif [ -n "$BASH_VERSION" ]; then
    eval "$(zoxide init bash)"
  fi
fi
