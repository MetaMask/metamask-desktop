#!/usr/bin/env bash

# Symlink App dependencies to the current Extension dependencies. There are 3 reasons for this:
#  1. We cannot have multiple copies of React. This means that react being loaded in the Desktop App UI needs
# to be the same as the one in the Extension deps (Desktop UI imports Extension components)
#  2. We need to patch webextension-polyfill for the Desktop UI. This needs to be propagated to the Extension deps, as the Extension components
# in the output bundle will reference the webextension-polyfill from the Extension deps.
#  3. Allow lavamoat to run on the Extension builds. This is purely for develop as it will allow us to generate an Extension bundle
# even when the Extension deps are symlinks to some of the Desktop App deps. (THIS DOES NOT SUPPORT BUNDLING WITH LAVAMOAT ENABLED)

EXTENSION_DIR="packages/app/submodules/extension"

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

rm -rf $EXTENSION_DIR/node_modules/@lavamoat/aa
ln -s ../../../../node_modules/@lavamoat/aa/ $EXTENSION_DIR/node_modules/@lavamoat/aa
