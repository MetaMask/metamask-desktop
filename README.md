# MetaMask Desktop

⚠️⚠️⚠️

METAMASK DESKTOP IS AN EXPERIMENTAL FEATURE.

IT CAN ONLY BE USED WITH [FLASK](https://metamask.io/flask/), THE CANARY DISTRIBUTION OF THE METAMASK EXTENSION, INTENDED FOR DEVELOPERS.

⚠️⚠️⚠️
<br><br>

The MetaMask Desktop app is one of many experiments we are exploring to improve our extension-driven experiences. The Desktop app improves the overall performance of the extension when using the Flask build.

This is useful for use cases like the execution of complex Snaps (e.g. zk-related Snaps), which are very demanding in terms of processing power.

You can find the latest version of MetaMask Desktop app on [our releases page](https://github.com/MetaMask/metamask-desktop/releases).

For help using MetaMask Desktop, or for general questions, feature requests, and developer questions, see the [Discussions tab](https://github.com/MetaMask/metamask-desktop/discussions).

Audit report for the MetaMask Desktop app can be found [here](https://consensys.net/diligence/audits/private/nz2e05ylhrkhzd/).


## Monorepo

This repo is a monorepo organised in workspaces:
| Name | Description
| --- | --- |
| [app](packages/app/README.md) | The MetaMask Desktop app, built with [Electron](https://www.electronjs.org/docs/latest), which can be paired with the Flask extension to improve its overall performance. |
| [common](packages/common/README.md) | The JavaScript library used by the Flask extension to connect to the Desktop app. |

## Getting Started

1. Install [Node.js](https://nodejs.org) version 16
   - If you are using [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) (recommended) running `nvm use` will automatically choose the right node version for you.

2. Install [Yarn](https://yarnpkg.com/en/docs/install).

3. Install dependencies for all packages:
```
yarn
yarn setup
```

4. Specify your personal [Infura Project ID](https://infura.io/docs) after `INFURA_PROJECT_ID=` in `packages/app/.env` and `packages/app/submodules/extension/.metamaskrc`.

5. Build both the MetaMask Desktop app and the Flask extension (wait until you see "The watcher is ready." logged in the console):
```
yarn build
```

6. Start the MetaMask Desktop app:
```
yarn app start
```

7. Add the Flask extension to your browser:
   - Select the build in the `packages/app/submodules/extension/dist` folder.
   - Follow the following intrustions for [Chrome](https://github.com/MetaMask/metamask-extension/blob/develop/docs/add-to-chrome.md) or the following instructions for [Firefox](https://github.com/MetaMask/metamask-extension/blob/develop/docs/add-to-firefox.md).

8. Pair the Desktop app with the Flask extension:
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

# Additional Documentation

- [Architecture](docs/architecture.md)
- [Encryption](docs/encryption.md)
- [Release Process](docs/release.md)
