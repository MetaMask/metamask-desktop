#!/bin/sh
# Clear electron state

case "$OSTYPE" in
  darwin*)  rm ~/Library/Application\ Support/Electron/*.json ;; 
  linux*)   rm ~/.config/Electron/*.json ;;
  msys*)    del $env:APPDATA/Electron/*.json ;;
  *)        echo "unknown os type: $OSTYPE" ;;
esac
