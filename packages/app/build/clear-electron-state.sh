#!/bin/sh
# Clear electron state

if [ -z "$OSTYPE" ]
then
  OSTYPE="`uname | tr '[:upper:]' '[:lower:]'`"
fi
case "$OSTYPE" in
  darwin*)  rm ~/Library/Application\ Support/Electron/*.json ;; 
  linux*)   rm ~/.config/Electron/*.json ;;
  msys*)    del $env:APPDATA/Electron/*.json ;;
  *)        echo "unknown os type: $OSTYPE" ;;
esac
