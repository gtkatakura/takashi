#!/bin/bash

function mac() {
  (ghostty \
    --title="Mac OS (SSH)" \
    -e ssh mac > /dev/null 2>&1 &)
}
