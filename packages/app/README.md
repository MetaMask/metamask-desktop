# MetaMask Desktop App
### Prerequisites

- Install [Node.js](https://nodejs.org) version 16
    - If you are using [nvm](https://github.com/creationix/nvm#installation) (recommended) running `nvm use` will automatically choose the right node version for you.
- Install [Yarn](https://yarnpkg.com/en/docs/install)

### Building locally

- Install dependencies: `yarn setup` (not the usual install command)
- Copy the `.metamaskrc.dist` file to `.metamaskrc`
    - Replace the `INFURA_PROJECT_ID` value with your own personal [Infura Project ID](https://infura.io/docs).
    - Optionally, replace the `PASSWORD` value with your development wallet password to avoid entering it each time you open the app.
- Run `yarn build:desktop` to start development environment. (This will open up extension, desktop main process and desktop renderer process in watch mode)
    - Run `yarn start:desktop` to run the electron application.

### Building locally with MV3 enabled

- Install dependencies: `yarn setup` (not the usual install command)
- Copy the `.metamaskrc.dist` file to `.metamaskrc`
    - `ENABLE_MV3=true` is automatically set at build step.
- Build the extension with desktop support using `yarn build:desktop:extension:mv3`.
- Build the desktop app using `yarn build:desktop:mv3`.
    - Run `yarn start:desktop` to run the desktop app.

### Running Unit Tests and Linting

Run unit tests and the linter with `yarn test`. To run just unit tests, run `yarn test:unit`.

You can run the linter by itself with `yarn lint`, and you can automatically fix some lint problems with `yarn lint:fix`. You can also run these two commands just on your local changes to save time with `yarn lint:changed` and `yarn lint:changed:fix` respectively.

### Clearing persistent data for desktop UI

Desktop UI persists data for the user settings and extension. 

To clear this data, run 
- `rm ~/Library/Application\ Support/Electron/mmd-desktop-ui*.json` for MacOS
- `del %APPDATA%\Electron\mmd-desktop-ui*.json` for Windows
- `rm ~/.config/Electron/mmd-desktop-ui*.json` for Linux


### Environment Variables

#### Development

| Name | Description |
| ---  | --- |
| COMPATIBILITY_VERSION_DESKTOP | Override the compatibility version of the desktop app. |
| COMPATIBILITY_VERSION_EXTENSION | Override the compatibility version of the extension. |
| DISABLE_WEB_SOCKET_ENCRYPTION | Set this to `1` to disable all encryption when communicating with the desktop app. |
| SKIP_OTP_PAIRING_FLOW | Set this to `1` to skip the pairing process when enabling desktop mode. |
