#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Initialise and clone submodules
git submodule init
git submodule update

# Write submodule commit hash to file for use by pipeline
SUBMODULE_COMMIT=$(cd packages/app/submodules/extension && git rev-parse HEAD)
echo $SUBMODULE_COMMIT > .submodule_commit
