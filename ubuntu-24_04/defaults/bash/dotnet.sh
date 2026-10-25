#!/bin/bash

# Fixes VSCode detection of .NET SDK
# ref: https://stackoverflow.com/questions/70820780/vscode-or-anothers-editors-dont-recognize-sdk-dotnet-installed-with-asdf
_dotnet_hook() {
  local previous_exit_status=$?;

  if which dotnet > /dev/null; then
    VERSION=$(dotnet --version)
    export DOTNET_MSBUILD_SDK_RESOLVER_SDKS_VER=$VERSION
    export DOTNET_MSBUILD_SDK_RESOLVER_SDKS_DIR="$HOME/.local/share/mise/installs/dotnet-core/$VERSION/sdk/$VERSION/Sdks"
    export DOTNET_MSBUILD_SDK_RESOLVER_CLI_DIR="$HOME/.local/share/mise/installs/dotnet-core/$VERSION"
  else
    unset DOTNET_MSBUILD_SDK_RESOLVER_SDKS_VER
    unset DOTNET_MSBUILD_SDK_RESOLVER_SDKS_DIR
    unset DOTNET_MSBUILD_SDK_RESOLVER_CLI_DIR
  fi

  return $previous_exit_status;
}

if [[ ";${PROMPT_COMMAND:-};" != *";_dotnet_hook;"* ]]; then
  PROMPT_COMMAND="${PROMPT_COMMAND:+$PROMPT_COMMAND;}_dotnet_hook"
fi
