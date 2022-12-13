#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status.
set -e

git submodule init
git submodule update

# Copy common package to submodule
# Not required when package is published
cp -r packages/common packages/app/submodules/extension/.desktop
