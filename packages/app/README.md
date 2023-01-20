# MetaMask Desktop App

This directory contains the MetaMask Desktop application, built with [Electron](https://www.electronjs.org/docs/latest), which can be paired with the Flask extension to improve its overall performance. 

## Getting Started

Build the [React](https://reactjs.org/) UI used by the Electron app:

```
yarn app build:ui
```

Build the Electron app:

```
yarn app build:app
```

Start the app:

```
yarn app start
```

## Package

Generate a suitable installer package for a specific operating system:

| Platform | Type | Command |
| --- | --- | --- |
| Windows | NSIS Installer | `yarn app package:win` |
| MacOS | DMG Image | `yarn app package:mac` |
| Linux | AppImage | `yarn app package:linux` |

## Test

### Unit Tests

```
yarn app test
```

### E2E Tests

Verify the behaviour of the extension when paired with the app:

```
yarn build:test:extension
yarn app test:e2e:extension
```

To verify the behaviour of the app itself, see the [Playwright setup instructions](test/playwright/README.md).

## Lint

Check for linting issues:

```
yarn app lint
```

Attempt to automatically fix linting issues:

```
yarn app lint:fix
```

## Debug

### Visual Studio Code

The repository contains configuration files to support debugging the app within Visual Studio Code.

| Configuration | Description |
| --- | --- |
| Electron - Main Process | Debug only the main Electron process which handles requests from the extension. |
| Electron - Renderer Processes | Debug only the Electron renderer processes which correspond to each Electron window. |
| Electron - All | Debug the Electron main and renderer processes simultaneously. |

1. Open the `Run and Debug` view.
2. Run the desired configuration.
3. Add breakpoints to any desired source files.

Note: _Source maps are used to support debugging with the original TypeScript files rather than any transpiled files in the `packages/app/dist` directory._

### Chrome Developer Tools

As each Electron window is ran in a Chrome instance, the Chrome developer tools can be used to debug the main renderer process.

1. Set `DESKTOP_UI_DEBUG=1` in `packages/app/.metamaskrc` before building the UI.
2. When in the main Electron window, press `Command / Control + Shift + I`.
3. Use the `sources` tab to create breakpoints in any of the source files.

## Configuration

The below variables can be specified using a `.metamaskrc` file in the `packages/app` directory.

### Environment Variables

| Name | Description |
| ---  | --- |
| COMPATIBILITY_VERSION_DESKTOP | Override the compatibility version of the desktop app. |
| COMPATIBILITY_VERSION_EXTENSION | Override the compatibility version of the extension. |
| DESKTOP_UI_DEBUG | Set to `1` to enable the Chrome developer tools in the main Electron window. |
| DISABLE_WEB_SOCKET_ENCRYPTION | Set to `1` to disable all encryption when communicating with the desktop app. |
| SKIP_OTP_PAIRING_FLOW | Set to `1` to skip the pairing process when enabling desktop mode. |

## Reset Electron State

The app persists data for both user preferences and extension state.

To clear all persisted state:

```
yarn app clear:electron-state
```

Note: _This will remove data for all Electron apps ran in development mode._