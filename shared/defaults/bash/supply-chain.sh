#!/bin/bash

# Dependency-download guards that live in the environment (the rest are config
# files written by shared/install/terminal/set-supply-chain.sh)

# Copilot CLI: no background self-update, so it changes only through `mise upgrade`
export COPILOT_AUTO_UPDATE=false

# pip outside a virtualenv can't touch the user or system site-packages
export PIP_REQUIRE_VIRTUALENV=1

# Antigravity CLI: no background self-update, so it changes only through `mise upgrade`
export AGY_CLI_DISABLE_AUTO_UPDATE=true
