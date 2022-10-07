#!/bin/sh

OUTPUT_DIR="dist_desktop"

echo "Rebuilding keytar"
yarn electron-rebuild -o keytar

echo "Removing existing build files"
rm -rf $OUTPUT_DIR

echo "Creating directories"
mkdir $OUTPUT_DIR
mkdir $OUTPUT_DIR/app

echo "Copying HTML"
cp -r app/desktop-pairing.html $OUTPUT_DIR/app/desktop-pairing.html
cp -r app/desktop.html $OUTPUT_DIR/app/desktop.html
cp -r app/desktop-trezor.html $OUTPUT_DIR/app/desktop-trezor.html

echo "Copying locales"
cp -r app/_locales $OUTPUT_DIR/app

# Export all shell variables
set -a

PHISHING_WARNING_PAGE_URL=https://metamask.github.io/phishing-warning/v1.1.0/
echo "Phishing Warning Page URL: $PHISHING_WARNING_PAGE_URL"

PACKAGE_VERSION=$(npm pkg get version)
echo "Package Version: ${PACKAGE_VERSION}"

# Add variables from .metamaskrc
# shellcheck disable=SC2046
if [ -f ".metamaskrc" ]; then
    echo "Loading .metamaskrc on environment"
    export $(< .metamaskrc grep -v ";" | grep -v -e '^$' | grep -v -e '=$')
fi

echo "Transpiling JavaScript"
babel . \
    -d ./$OUTPUT_DIR \
    --extensions ".ts,.js" \
    --config-file "./babel-desktop.config.js" \
