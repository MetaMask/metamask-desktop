# MetaMask Desktop

A monorepo containing all code relating to MetaMask Desktop.

## Packages

- [App](./packages/app/README.md)
  - Both the [desktop app](./packages/app/app/scripts/desktop/README.md), and the MetaMask browser extension with added support for connecting to the desktop app.

## Prerequisites

- Install [Node.js](https://nodejs.org) 16.
  - If using [nvm](https://github.com/creationix/nvm#installation) (recommended), running `nvm use` will automatically select the correct Node version.
- Install [Yarn](https://yarnpkg.com/en/docs/install).

## Usage

Install dependencies for all packages:
```
yarn setup
```
  
Run a script for a specific package:
```
yarn [package] [script]

e.g. yarn app build:desktop
```
