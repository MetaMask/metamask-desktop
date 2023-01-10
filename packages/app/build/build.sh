#!/bin/sh

OUTPUT_DIR="dist/app"
OUTPUT_HTML_DIR="$OUTPUT_DIR/html"
SOURCE_HTML_DIR="html"
EXTENSION_DIR="submodules/extension"
OUTPUT_EXTENSION_DIR="$OUTPUT_DIR/$EXTENSION_DIR"
OUTPUT_APP_DIR="$OUTPUT_EXTENSION_DIR/app"
EXTENSION_APP_DIR="$EXTENSION_DIR/app"

echo "Removing existing build files"
rm -rf $OUTPUT_DIR

echo "Creating directories"
mkdir -p $OUTPUT_HTML_DIR
mkdir -p $OUTPUT_APP_DIR

echo "Copying HTML"
cp $SOURCE_HTML_DIR/desktop-trezor.html $OUTPUT_HTML_DIR/desktop-trezor.html
cp $SOURCE_HTML_DIR/desktop-lattice.html $OUTPUT_HTML_DIR/desktop-lattice.html

echo "Copying locales"
cp -r $EXTENSION_APP_DIR/_locales $OUTPUT_APP_DIR/_locales

echo "Copying assets"
mkdir -p $OUTPUT_APP_DIR/build-types/flask/images
cp $EXTENSION_APP_DIR/build-types/flask/images/flask-mascot.json $OUTPUT_APP_DIR/build-types/flask/images/

# Export all shell variables
set -a

PHISHING_WARNING_PAGE_URL=${PHISHING_WARNING_PAGE_URL-https://metamask.github.io/phishing-warning/v1.2.1/}
echo "Phishing Warning Page URL: $PHISHING_WARNING_PAGE_URL"

PACKAGE_VERSION=$(npm pkg get version | grep -Eo "[0-9.]+")
echo "Package Version: ${PACKAGE_VERSION}"

SKIP_BACKGROUND_INITIALIZATION='true'
echo "Skipping background.js initialization: ${SKIP_BACKGROUND_INITIALIZATION}"

# Add variables from .metamaskrc
# shellcheck disable=SC2046
if [ -f ".metamaskrc" ]; then
    echo "Loading .metamaskrc on environment"
    export $(< .metamaskrc grep -v ";" | grep -v -e '^$' | grep -v -e '=$')
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
