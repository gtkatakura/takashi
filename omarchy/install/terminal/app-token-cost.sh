#!/bin/bash

# Claude Code token-cost tooling (docs/token-cost/TEST-PLAN.md). The scripts in macbook/token-cost
# run on Linux too: they need Bun, RTK and ccusage. Only install what is missing, so existing
# version pins in the global mise config stay as they are.
command -v rtk >/dev/null || mise use -g github:rtk-ai/rtk@latest
bun --version >/dev/null 2>&1 || mise use -g bun@latest
command -v ccusage >/dev/null || mise use -g npm:ccusage@latest
