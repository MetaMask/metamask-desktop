# MetaMask Desktop

⚠️⚠️⚠️

METAMASK DESKTOP IS AN EXPERIMENTAL FEATURE.

IT CAN ONLY BE USED WITH [FLASK](https://metamask.io/flask/), THE CANARY DISTRIBUTION OF THE METAMASK EXTENSION, INTENDED FOR DEVELOPERS.

⚠️⚠️⚠️
<br><br>

The MetaMask desktop app is a companion app which speeds up the [MetaMask browser extension](https://github.com/MetaMask/metamask-extension).

You can find the latest version of MetaMask desktop app on [our releases page](https://github.com/MetaMask/desktop/releases). For help using MetaMask, visit our [User Support Site](https://metamask.zendesk.com/hc/en-us).

For [general questions](https://community.metamask.io/c/learn/26), [feature requests](https://community.metamask.io/c/feature-requests-ideas/13), or [developer questions](https://community.metamask.io/c/developer-questions/11), visit our [Community Forum](https://community.metamask.io/).

## Monorepo

This repo is a monorepo organised in workspaces:
| Name | Description
| --- | --- |
| app | The MetaMask desktop app, built with [Electron](https://www.electronjs.org/docs/latest), which can be paired with the [MetaMask browser extension](https://github.com/MetaMask/metamask-extension) to speed it up by executing the background logic. |
| common | The JavaScript library used by the [MetaMask browser extension](https://github.com/MetaMask/metamask-extension) to connect to the desktop app. |

## Getting Started

1. Install [Node.js](https://nodejs.org) version 16
   - If you are using [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) (recommended) running `nvm use` will automatically choose the right node version for you.


2. Install [Yarn](https://yarnpkg.com/en/docs/install).


3. Go in [packages/app/submodules/extension](packages/app/submodules/extension), copy the `.metamaskrc.dist` file to `.metamaskrc`.
   - Replace the `INFURA_PROJECT_ID` value with your own personal [Infura Project ID](https://infura.io/docs).
   - Optionally, replace the `PASSWORD` value with your development wallet password to avoid entering it each time you open the app.


4. Copy the `.metamaskrc` file and add it to [packages/app](packages/app) as well.


5. Install dependencies for all packages:
```
yarn setup
```

6. Build both the MetaMask desktop app and the MetaMask browser extension (wait until you see "The watcher is ready." logged in the console):
```
yarn build
```

7. Start the MetaMask desktop app:
```
yarn app start
```

8. Add the MetaMask browser extension to your browser:
   - Select the build in the `packages/app/submodules/extension/dist` folder
   - Follow the following intrustions for [Chrome](https://github.com/MetaMask/metamask-extension/blob/develop/docs/add-to-chrome.md) or the following instructions for [Firefox](https://github.com/MetaMask/metamask-extension/blob/develop/docs/add-to-firefox.md)

9. Pair the desktop app with the extension:
   - Open the extension
   - Go to `Settings > Experimental`
   - Click `Enable Desktop app`
   - Enter the 6-digit code, visible in the extension, in the desktop app

If you see "All set Fox" message displayed in your desktop app, it means you're good to go! 🚀🚀🚀

Your MetaMask desktop app now acts as a companion app for your MetaMask browser extension which shall speed it up.

## Other scripts

Run a script for a specific package:
```
yarn [package] [script]

e.g. yarn app package:mac
```
