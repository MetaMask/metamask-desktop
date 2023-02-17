#!/usr/bin/env bash

EXTENSION_DIR="packages/app/submodules/extension"

if [ ! "$NO_COMMON_LINK" ]; then
  # Use common workspace in extension
  cd packages/app/submodules/extension
  yarn link ../../../common
  cd -
fi

# Ensure an extension env file exists
if [ ! -f "packages/app/submodules/extension/.metamaskrc" ]; then
  if [ -f "packages/app/.metamaskrc" ]; then
    cp packages/app/.metamaskrc packages/app/submodules/extension/
  else
    cp packages/app/.metamaskrc.dist packages/app/submodules/extension/.metamaskrc
  fi
fi

# Ensure an app env file exists
if [ ! -f "packages/app/.env" ]; then
  cp packages/app/.env.example packages/app/.env
fi

# Ensure the React dependencies are identical in the extension and app to avoid two React instances at runtime in app UI
echo "Linking extension dependencies to app"
for DEPENDENCY in $(ls $EXTENSION_DIR/node_modules | grep react); do
  rm -rf $EXTENSION_DIR/node_modules/$DEPENDENCY
  ln -s ../../../node_modules/$DEPENDENCY/ $EXTENSION_DIR/node_modules/$DEPENDENCY
  echo "Processed extension dependency: $DEPENDENCY"
done

# Extend the webextension-polyfill patch to Extension deps
echo "Linking extension dependencies to app"
for DEPENDENCY in $(ls $EXTENSION_DIR/node_modules | grep webextension-polyfill); do
  rm -rf $EXTENSION_DIR/node_modules/$DEPENDENCY
  ln -s ../../../node_modules/$DEPENDENCY/ $EXTENSION_DIR/node_modules/$DEPENDENCY
  echo "Processed extension dependency: $DEPENDENCY"
done
