#!/bin/sh

OUTPUT_DIR="dist_desktop"

echo "Rebuilding leveldown for Electron to support 3box"
yarn electron-rebuild -o leveldown,keytar

echo "Removing existing build files"
rm -rf $OUTPUT_DIR

echo "Creating directories"
mkdir $OUTPUT_DIR
mkdir $OUTPUT_DIR/app

echo "Copying HTML"
cp -r app/desktop-sync.html $OUTPUT_DIR/app/desktop-sync.html

echo "Copying locales"
cp -r app/_locales $OUTPUT_DIR/app

# Export all shell variables
set -a

# Set desktop specific variables
DESKTOP=APP
echo "Desktop Mode: $DESKTOP"

PHISHING_WARNING_PAGE_URL=https://metamask.github.io/phishing-warning/v1.1.0/
echo "Phishing Warning Page URL: $PHISHING_WARNING_PAGE_URL"

# Add variables from .metamaskrc
# shellcheck disable=SC2046
export $(< .metamaskrc grep -v ";" | xargs)

echo "Transpiling JavaScript"
babel . \
    -d ./$OUTPUT_DIR \
    --extensions ".ts,.js" \
    --config-file "./babel-desktop.config.js" \
    --watch
