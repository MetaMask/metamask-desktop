#!/usr/bin/env bash

# Delete any existing common package in extension
rm -rf packages/app/submodules/extension/.desktop

# Copy common package to extension
# Required as the extension is not a workspace so the common package is loaded using a local directory
cp -r packages/common packages/app/submodules/extension/.desktop

# Copy the extension config from the app workspace into the extension
if [ -f "packages/app/.metamaskrc" ]; then
  cp packages/app/.metamaskrc packages/app/submodules/extension/
else
  echo ".metamaskrc file not found"
fi
