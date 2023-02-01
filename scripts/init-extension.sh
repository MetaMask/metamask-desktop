#!/usr/bin/env bash

# Delete any existing common package in extension
rm -rf packages/app/submodules/extension/.desktop

# Copy common package to extension
# Required as the extension is not a workspace so the common package is loaded using a local directory
cp -r packages/common packages/app/submodules/extension/.desktop

# Ensure an extension env file exists
if [ ! -f "packages/app/submodules/extension/.metamaskrc" ]; then
  if [ -f "packages/app/.metamaskrc" ]; then
    cp packages/app/.metamaskrc packages/app/submodules/extension/
  else
    cp packages/app/.metamaskrc.dist packages/app/submodules/extension/.metamaskrc
  fi
fi

# Ensure an app env file exists
if [ ! -f "packages/app/.env" ]; then
  cp packages/app/.env.example packages/app/.env
fi
