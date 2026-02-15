#!/bin/bash

# Use Starship with our own config when available
if command -v starship &> /dev/null; then
  export STARSHIP_CONFIG="$HOME/.local/share/takashi/shared/defaults/starship.toml"
  eval "$(starship init bash)"
  return 0 2>/dev/null || exit 0
fi

parse_git_branch() {
  git branch 2> /dev/null | sed -e '/^[^*]/d' -e 's/* \(.*\)/(\1) /'
}

if [[ -n "$ZSH_VERSION" ]]; then
  COLOR_OFF="%f"
  GREEN="%F{green}"
  YELLOW="%F{yellow}"

  setopt PROMPT_SUBST
  export PROMPT="${GREEN}%~ ${YELLOW}\$(parse_git_branch)${COLOR_OFF}$ "
else
  COLOR_OFF="\[\033[0m\]"
  GREEN="\[\033[0;32m\]"
  YELLOW="\[\033[0;33m\]"

  if [ -n "$ALACRITTY_WINDOW_ID" ]; then
    CARET_ICON=$' \uf0a9'
    SET_CWD_AS_WINDOW_TITLE="\[\e]0;\w\a\]"
    export PS1="${SET_CWD_AS_WINDOW_TITLE}${GREEN}$CARET_ICON ${YELLOW}\$(parse_git_branch)${COLOR_OFF}$ "
  else
    export PS1="${GREEN}\w ${YELLOW}\$(parse_git_branch)${COLOR_OFF}$ "
  fi
fi
