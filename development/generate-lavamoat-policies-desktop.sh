#!/usr/bin/env bash

set -e
set -u
set -o pipefail

# Generate LavaMoat policies for the desktop bundle for each build
# type.
# ATTN: This may tax your device when running it locally.
concurrently --kill-others-on-fail -n main,beta,flask \
  "WRITE_AUTO_POLICY=1 yarn build scripts:prod --policy-only --build-platform=desktop" \
  "WRITE_AUTO_POLICY=1 yarn build scripts:prod --policy-only --build-type beta --build-platform=desktop" \
  "WRITE_AUTO_POLICY=1 yarn build scripts:prod --policy-only --build-type flask --build-platform=desktop"
