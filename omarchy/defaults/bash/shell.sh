#!/bin/bash

function update_all() {
  sudo pacman -Syu
  yay -Syu
}

alias rdocker='sudo systemctl restart docker' # overrides shared: rdocker='sudo service docker restart'
