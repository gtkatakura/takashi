#!/bin/bash

# Omarchy ships Claude Code and Codex through mise but not Gemini: add it the same way
green_text "Installing Gemini CLI"
mise use -g gemini@latest
