# MetaMask Desktop app

⚠️⚠️⚠️

METAMASK DESKTOP APP IS AN EXPERIMENTAL FEATURE.

IT CAN ONLY BE USED WITH [FLASK](https://metamask.io/flask/), THE CANARY DISTRIBUTION OF THE METAMASK EXTENSION, INTENDED FOR DEVELOPERS.

⚠️⚠️⚠️
<br><br>

The MetaMask desktop app is a companion app which allows to speed up the [MetaMask browser extension](https://github.com/MetaMask/metamask-extension).

You can find the latest version of MetaMask desktop app on [our releases page](https://github.com/MetaMask/desktop/releases). For help using MetaMask, visit our [User Support Site](https://metamask.zendesk.com/hc/en-us).

For [general questions](https://community.metamask.io/c/learn/26), [feature requests](https://community.metamask.io/c/feature-requests-ideas/13), or [developer questions](https://community.metamask.io/c/developer-questions/11), visit our [Community Forum](https://community.metamask.io/).

## Monorepo

This repo is a monorepo organised in workspaces:
| Name | Description
| --- | --- |
| app | The MetaMask desktop app, built with [Electron](https://www.electronjs.org/docs/latest), which can be paired with the [MetaMask browser extension](https://github.com/MetaMask/metamask-extension) to speed it up by executing the background logic. |
| common | The JavaScript library used by the [MetaMask browser extension](https://github.com/MetaMask/metamask-extension) to connect to the desktop app. |

## Prerequisites

- Install [Node.js](https://nodejs.org) version 16
    - If you are using [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) (recommended) running `nvm use` will automatically choose the right node version for you.
- Install [Yarn v3](https://yarnpkg.com/getting-started/install)
- Go in [packages/app/submodules/extension](packages/app/submodules/extension), copy the `.metamaskrc.dist` file to `.metamaskrc`
    - Replace the `INFURA_PROJECT_ID` value with your own personal [Infura Project ID](https://infura.io/docs).
    - Optionally, replace the `PASSWORD` value with your development wallet password to avoid entering it each time you open the app.
- Copy the `.metamaskrc` file and add it to [packages/app](packages/app) as well.

## Get started

Install dependencies for all packages:
```
yarn setup
```

Build both the MetaMask desktop app and the MetaMask browser extension:
```
yarn build
```

Once you see "The watcher is ready." logged in the console, it means your MetaMask browser extension is ready to be added to your browser and used.

If you use [Firefox](https://www.mozilla.org/) browser:
- Type "about:debugging" in the navigation bar
- Click on "This Firefox"
- Click on "Load Temporary Add-on..."
- Select `packages/app/submodules/extension/dist/firefox/manifest.json` and click on "Open"

MetaMask browser extension can now be used.

Start the MetaMask desktop app:
```
yarn app start
```
MetaMask desktop app can now be used as well.

Pair the desktop app with the extension:
- Open the extension
- Go in "Settings/Experimental"
- Scroll to the bottom and click on the blue button "Enable Desktop app"
- A 6-digit code appears, copy it
- Go to the desktop app and paste it there

If you see "All set Fox" message displayed in your desktop app, it means you're good to go! 🚀🚀🚀

Your MetaMask desktop app now acts as a companion app for your MetaMask browser extension.

This means the background script of the extension now runs in the desktop app which shall speed up the extension.

## Other scripts

Run a script for a specific package:
```
yarn [package] [script]

e.g. yarn app package:mac
```
