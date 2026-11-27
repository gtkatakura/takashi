#!/bin/bash

# Omarchy ships Claude Code and Codex through mise but not Antigravity: add it the same way
green_text "Installing Antigravity CLI"
mise use -g antigravity-cli@latest
