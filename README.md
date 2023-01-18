# MetaMask Desktop

⚠️⚠️⚠️

METAMASK DESKTOP IS AN EXPERIMENTAL FEATURE.

IT CAN ONLY BE USED WITH [FLASK](https://metamask.io/flask/), THE CANARY DISTRIBUTION OF THE METAMASK EXTENSION, INTENDED FOR DEVELOPERS.

⚠️⚠️⚠️
<br><br>

The MetaMask Desktop app is one of many experiments we are exploring to improve our extension-driven experiences. The Desktop app improves the overall performance of the extension when using the Flask build.

This is useful for use cases like the execution of complex Snaps (e.g. zk-related Snaps), which are very demanding in terms of processing power.

You can find the latest version of MetaMask Desktop app on [our releases page](https://github.com/MetaMask/desktop/releases).

For help using MetaMask Desktop, or for general questions, feature requests, and developer questions, see the [Discussions tab](https://github.com/MetaMask/desktop/discussions).


## Monorepo

This repo is a monorepo organised in workspaces:
| Name | Description
| --- | --- |
| app | The MetaMask Desktop app, built with [Electron](https://www.electronjs.org/docs/latest), which can be paired with the Flask extension to improve its overall performance. |
| common | The JavaScript library used by the Flask extension to connect to the Desktop app. |

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

6. Build both the MetaMask Desktop app and the Flask extension (wait until you see "The watcher is ready." logged in the console):
```
yarn build
```

7. Start the MetaMask Desktop app:
```
yarn app start
```

8. Add the Flask extension to your browser:
   - Select the build in the `packages/app/submodules/extension/dist` folder.
   - Follow the following intrustions for [Chrome](https://github.com/MetaMask/metamask-extension/blob/develop/docs/add-to-chrome.md) or the following instructions for [Firefox](https://github.com/MetaMask/metamask-extension/blob/develop/docs/add-to-firefox.md).

9. Pair the Desktop app with the Flask extension:
   - Open the Flask extension.
   - Go to `Settings > Experimental`.
   - Click `Enable Desktop app`.
   - Enter the 6-digit code, visible in the Flask extension, in the Desktop app.

If you see "All set Fox" message displayed in your Desktop app, it means you're good to go! 🚀🚀🚀

Your MetaMask Desktop app now acts as a companion app for your Flask extension which shall improve its overall performance.

## Other Scripts

Run a script for a specific package:
```
yarn [package] [script]

e.g. yarn app package:mac
```
