# MetaMask Desktop

A monorepo containing all code relating to MetaMask Desktop.

## Packages

| Name | Description
| --- | --- |
| app | The [Electron](https://www.electronjs.org/docs/latest) desktop app built around the [extension](packages/app/submodules/extension/README.md) background logic. |
| common | The JavaScript library used by the [extension](https://github.com/MetaMask/metamask-extension) to connect to the desktop app. |

## Prerequisites

- Install [Node.js](https://nodejs.org) 16.
  - It is recommended to install [nvm](https://github.com/creationix/nvm#installation) and run `nvm use` to automatically select the correct Node version.
- Install [Yarn](https://yarnpkg.com/en/docs/install).

## Usage

Install dependencies for all packages:
```
yarn setup
```

Build the app, UI, and extension:
```
yarn build
```

Start the app:
```
yarn app start
```
  
Run a script for a specific package:
```
yarn [package] [script]

e.g. yarn app package:mac
```
