#!/usr/bin/env bash

set -e
set -u
set -o pipefail

yarn lavamoat:auto:ci

if git diff --exit-code
then
  echo "LavaMoat policy is up-to-date"
else
  echo "LavaMoat policy requires updates"
  exit 1
fi
