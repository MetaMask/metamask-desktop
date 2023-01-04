#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Point the host file to null and disable host checking
if [ "$CI" = "true" ];
then
    echo "CI: setting GIT_SSH_COMMAND"
    export GIT_SSH_COMMAND="ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no"
fi

# Initialise and clone submodules
git submodule init
git submodule update
