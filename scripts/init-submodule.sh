#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Initialise and clone submodules
git submodule init
git submodule update
