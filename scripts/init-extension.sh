#!/usr/bin/env bash

# Use common workspace in extension
cd packages/app/submodules/extension
yarn link ../../../common
cd -

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
