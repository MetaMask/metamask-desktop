#!/usr/bin/env bash

set -e
set -u
set -o pipefail

yarn ${SCRIPT}

if git diff --exit-code
then
  echo "allow-scripts configuration is up-to-date"
else
  echo "allow-scripts configuration requires updates"
  exit 1
fi
