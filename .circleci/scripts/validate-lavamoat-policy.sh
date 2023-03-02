#!/usr/bin/env bash

set -e
set -u
set -o pipefail

yarn ${SCRIPT}

if git diff --exit-code -- ":(exclude)packages/app/submodules/extension"
then
  echo "LavaMoat policy is up-to-date"
else
  echo "LavaMoat policy requires updates"
  exit 1
fi
