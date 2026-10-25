#!/bin/bash

# omarchy-update also covers AUR, mise and Omarchy migrations, with a snapshot first
function update_all() {
  omarchy-update "$@"
}

alias rdocker='sudo systemctl restart docker' # overrides shared: rdocker='sudo service docker restart'
