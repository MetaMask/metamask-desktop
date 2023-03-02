#!/bin/sh

APP_DIR="src/app"
SHARED_DIR="src/shared"
SOURCE_HW_DIR="$APP_DIR/hw"
EXTENSION_DIR="submodules/extension"
EXTENSION_APP_DIR="$EXTENSION_DIR/app"
OUTPUT_DIR="dist/app"
OUTPUT_HTML_DIR="$OUTPUT_DIR/html"
OUTPUT_EXTENSION_DIR="$OUTPUT_DIR/$EXTENSION_DIR"
OUTPUT_APP_DIR="$OUTPUT_EXTENSION_DIR/app"

echo "Removing existing build files"
rm -rf $OUTPUT_DIR

echo "Creating directories"
mkdir -p $OUTPUT_HTML_DIR
mkdir -p $OUTPUT_APP_DIR
mkdir -p $OUTPUT_DIR/src/app/icons
mkdir -p $OUTPUT_DIR/$SHARED_DIR/locales/

echo "Copying HW HTML files"
cp $SOURCE_HW_DIR/trezor/desktop-trezor.html $OUTPUT_HTML_DIR/desktop-trezor.html
cp $SOURCE_HW_DIR/lattice/desktop-lattice.html $OUTPUT_HTML_DIR/desktop-lattice.html

echo "Copying locales"
cp -r $EXTENSION_APP_DIR/_locales $OUTPUT_APP_DIR/_locales

echo "Copying shared locales"
cp $SHARED_DIR/locales/*.json $OUTPUT_DIR/$SHARED_DIR/locales/

echo "Copying assets"
mkdir -p $OUTPUT_APP_DIR/build-types/desktop/images
mkdir -p $OUTPUT_APP_DIR/build-types/flask/images
cp $EXTENSION_APP_DIR/build-types/desktop/images/desktop-mascot.json $OUTPUT_APP_DIR/build-types/desktop/images/
cp $EXTENSION_APP_DIR/build-types/flask/images/flask-mascot.json $OUTPUT_APP_DIR/build-types/flask/images/
cp -r $APP_DIR/icons $OUTPUT_DIR/src/app

# Export all shell variables
set -a

PHISHING_WARNING_PAGE_URL=${PHISHING_WARNING_PAGE_URL-https://metamask.github.io/phishing-warning/v1.2.1/}
echo "Phishing Warning Page URL: $PHISHING_WARNING_PAGE_URL"

PACKAGE_VERSION=$(npm pkg get version | grep -Eo "[0-9.]+")
echo "Package Version: ${PACKAGE_VERSION}"

SKIP_BACKGROUND_INITIALIZATION='true'
echo "Skipping background.js initialization: ${SKIP_BACKGROUND_INITIALIZATION}"

# shellcheck disable=SC2046
if [ -f ".env" ]; then
    echo "Loading environment variables from file"
    export $(< .env grep -v "#" | grep -v -e '^$' | grep -v -e '=$')
else
    echo "No environment variable file found"
fi

echo "Transpiling JavaScript"
if [ "$CI" = "true" ]; then
    babel ./ \
        -d ./$OUTPUT_DIR \
        --extensions ".ts,.js" \
        --config-file "./babel-app.config.js"
else
     babel ./ \
        -d ./$OUTPUT_DIR \
        --extensions ".ts,.js" \
        --config-file "./babel-app.config.js" \
        --watch
fi
