#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status.
set -e

git submodule init
git submodule update

# Update submodule to use common package from monorepo instead of local directory
sed -i '' 's/link:.\/.desktop/*/' packages/app/submodules/extension/package.json
