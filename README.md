# MetaMask Browser Extension

You can find the latest version of MetaMask on [our official website](https://metamask.io/). For help using MetaMask, visit our [User Support Site](https://metamask.zendesk.com/hc/en-us).

For [general questions](https://community.metamask.io/c/learn/26), [feature requests](https://community.metamask.io/c/feature-requests-ideas/13), or [developer questions](https://community.metamask.io/c/developer-questions/11), visit our [Community Forum](https://community.metamask.io/).

MetaMask supports Firefox, Google Chrome, and Chromium-based browsers. We recommend using the latest available browser version.

For up to the minute news, follow our [Twitter](https://twitter.com/metamask) or [Medium](https://medium.com/metamask) pages.

To learn how to develop MetaMask-compatible applications, visit our [Developer Docs](https://metamask.github.io/metamask-docs/).

To learn how to contribute to the MetaMask project itself, visit our [Internal Docs](https://github.com/MetaMask/metamask-extension/tree/develop/docs).

## Building locally

- Install [Node.js](https://nodejs.org) version 16
    - If you are using [nvm](https://github.com/creationix/nvm#installation) (recommended) running `nvm use` will automatically choose the right node version for you.
- Install [Yarn](https://yarnpkg.com/en/docs/install)
- Install dependencies: `yarn setup` (not the usual install command)
- Copy the `.metamaskrc.dist` file to `.metamaskrc`
    - Replace the `INFURA_PROJECT_ID` value with your own personal [Infura Project ID](https://infura.io/docs).
    - If debugging MetaMetrics, you'll need to add a value for `SEGMENT_WRITE_KEY` [Segment write key](https://segment.com/docs/connections/find-writekey/), see [Developing on MetaMask - Segment](./development/README.md#segment).
    - If debugging unhandled exceptions, you'll need to add a value for `SENTRY_DSN` [Sentry Dsn](https://docs.sentry.io/product/sentry-basics/dsn-explainer/), see [Developing on MetaMask - Sentry](./development/README.md#sentry).
    - Optionally, replace the `PASSWORD` value with your development wallet password to avoid entering it each time you open the app.
- Build the project to the `./dist/` folder with `yarn dist`.
    - Optionally, you may run `yarn start` to run dev mode.

Uncompressed builds can be found in `/dist`, compressed builds can be found in `/builds` once they're built.

See the [build system readme](./development/build/README.md) for build system usage information.

## Contributing

### Development builds

To start a development build (e.g. with logging and file watching) run `yarn start`.

#### React and Redux DevTools

To start the [React DevTools](https://github.com/facebook/react-devtools), run `yarn devtools:react` with a development build installed in a browser. This will open in a separate window; no browser extension is required.

To start the [Redux DevTools Extension](https://github.com/reduxjs/redux-devtools/tree/main/extension):
- Install the package `remotedev-server` globally (e.g. `yarn global add remotedev-server`)
- Install the Redux Devtools extension.
- Open the Redux DevTools extension and check the "Use custom (local) server" checkbox in the Remote DevTools Settings, using the default server configuration (host `localhost`, port `8000`, secure connection checkbox unchecked).

Then run the command `yarn devtools:redux` with a development build installed in a browser. This will enable you to use the Redux DevTools extension to inspect MetaMask.

To create a development build and run both of these tools simultaneously, run `yarn start:dev`.

#### Test Dapp

[This test site](https://metamask.github.io/test-dapp/) can be used to execute different user flows.

### Running Unit Tests and Linting

Run unit tests and the linter with `yarn test`. To run just unit tests, run `yarn test:unit`.

You can run the linter by itself with `yarn lint`, and you can automatically fix some lint problems with `yarn lint:fix`. You can also run these two commands just on your local changes to save time with `yarn lint:changed` and `yarn lint:changed:fix` respectively.

### Running E2E Tests

Our e2e test suite can be run on either Firefox or Chrome. In either case, start by creating a test build by running `yarn build:test`.

- Firefox e2e tests can be run with `yarn test:e2e:firefox`.

- Chrome e2e tests can be run with `yarn test:e2e:chrome`. The `chromedriver` package major version must match the major version of your local Chrome installation. If they don't match, update whichever is behind before running Chrome e2e tests.

- Single e2e tests can be run with `yarn test:e2e:single test/e2e/tests/TEST_NAME.spec.js` along with the options below.

```console
--browser             Set the browser used; either 'chrome' or 'firefox'.

--leave-running       Leaves the browser running after a test fails, along with anything else
                      that the test used (ganache, the test dapp, etc.).

--retries             Set how many times the test should be retried upon failure. Default is 0.
```

An example for running `account-details` testcase with chrome and leaving the browser open would be:
`yarn test:e2e:single test/e2e/tests/account-details.spec.js --browser=chrome --leave-running`

### Changing dependencies

Whenever you change dependencies (adding, removing, or updating, either in `package.json` or `yarn.lock`), there are various files that must be kept up-to-date.

* `yarn.lock`:
  * Run `yarn setup` again after your changes to ensure `yarn.lock` has been properly updated.
  * Run `yarn yarn-deduplicate` to remove duplicate dependencies from the lockfile.
* The `allow-scripts` configuration in `package.json`
  * Run `yarn allow-scripts auto` to update the `allow-scripts` configuration automatically. This config determines whether the package's install/postinstall scripts are allowed to run. Review each new package to determine whether the install script needs to run or not, testing if necessary.
  * Unfortunately, `yarn allow-scripts auto` will behave inconsistently on different platforms. macOS and Windows users may see extraneous changes relating to optional dependencies.
* The LavaMoat policy files. The _tl;dr_ is to run `yarn lavamoat:auto` to update these files, but there can be devils in the details:
  * There are two sets of LavaMoat policy files:
    * The production LavaMoat policy files (`lavamoat/browserify/*/policy.json`), which are re-generated using `yarn lavamoat:background:auto`. Add `--help` for usage.
      * These should be regenerated whenever the production dependencies for the background change.
    * The build system LavaMoat policy file (`lavamoat/build-system/policy.json`), which is re-generated using `yarn lavamoat:build:auto`.
      * This should be regenerated whenever the dependencies used by the build system itself change.
  * Whenever you regenerate a policy file, review the changes to determine whether the access granted to each package seems appropriate.
  * Unfortunately, `yarn lavamoat:auto` will behave inconsistently on different platforms.
  macOS and Windows users may see extraneous changes relating to optional dependencies.
  * If you keep getting policy failures even after regenerating the policy files, try regenerating the policies after a clean install by doing:
    * `rm -rf node_modules/ && yarn setup && yarn lavamoat:auto`
  * Keep in mind that any kind of dynamic import or dynamic use of globals may elude LavaMoat's static analysis.
  Refer to the LavaMoat documentation or ask for help if you run into any issues.

## Architecture

- [Visual of the controller hierarchy and dependencies as of summer 2022.](https://gist.github.com/rekmarks/8dba6306695dcd44967cce4b6a94ae33)
- [Visual of the entire codebase.](https://mango-dune-07a8b7110.1.azurestaticapps.net/?repo=metamask%2Fmetamask-extension)

[![Architecture Diagram](./docs/architecture.png)][1]

## Other Docs

- [How to add custom build to Chrome](./docs/add-to-chrome.md)
- [How to add custom build to Firefox](./docs/add-to-firefox.md)
- [How to add a new translation to MetaMask](./docs/translating-guide.md)
- [Publishing Guide](./docs/publishing.md)
- [How to use the TREZOR emulator](./docs/trezor-emulator.md)
- [Developing on MetaMask](./development/README.md)
- [How to generate a visualization of this repository's development](./development/gource-viz.sh)

## Dapp Developer Resources
- [Extend MetaMask's features w/ MetaMask Snaps.](https://docs.metamask.io/guide/snaps.html)
- [Prompt your users to add and switch to a new network.](https://medium.com/metamask/connect-users-to-layer-2-networks-with-the-metamask-custom-networks-api-d0873fac51e5)
- [Change the logo that appears when your dapp connects to MetaMask.](https://docs.metamask.io/guide/defining-your-icon.html)

[1]: http://www.nomnoml.com/#view/%5B%3Cactor%3Euser%5D%0A%0A%5Bmetamask-ui%7C%0A%20%20%20%5Btools%7C%0A%20%20%20%20%20react%0A%20%20%20%20%20redux%0A%20%20%20%20%20thunk%0A%20%20%20%20%20ethUtils%0A%20%20%20%20%20jazzicon%0A%20%20%20%5D%0A%20%20%20%5Bcomponents%7C%0A%20%20%20%20%20app%0A%20%20%20%20%20account-detail%0A%20%20%20%20%20accounts%0A%20%20%20%20%20locked-screen%0A%20%20%20%20%20restore-vault%0A%20%20%20%20%20identicon%0A%20%20%20%20%20config%0A%20%20%20%20%20info%0A%20%20%20%5D%0A%20%20%20%5Breducers%7C%0A%20%20%20%20%20app%0A%20%20%20%20%20metamask%0A%20%20%20%20%20identities%0A%20%20%20%5D%0A%20%20%20%5Bactions%7C%0A%20%20%20%20%20%5BbackgroundConnection%5D%0A%20%20%20%5D%0A%20%20%20%5Bcomponents%5D%3A-%3E%5Bactions%5D%0A%20%20%20%5Bactions%5D%3A-%3E%5Breducers%5D%0A%20%20%20%5Breducers%5D%3A-%3E%5Bcomponents%5D%0A%5D%0A%0A%5Bweb%20dapp%7C%0A%20%20%5Bui%20code%5D%0A%20%20%5Bweb3%5D%0A%20%20%5Bmetamask-inpage%5D%0A%20%20%0A%20%20%5B%3Cactor%3Eui%20developer%5D%0A%20%20%5Bui%20developer%5D-%3E%5Bui%20code%5D%0A%20%20%5Bui%20code%5D%3C-%3E%5Bweb3%5D%0A%20%20%5Bweb3%5D%3C-%3E%5Bmetamask-inpage%5D%0A%5D%0A%0A%5Bmetamask-background%7C%0A%20%20%5Bprovider-engine%5D%0A%20%20%5Bhooked%20wallet%20subprovider%5D%0A%20%20%5Bid%20store%5D%0A%20%20%0A%20%20%5Bprovider-engine%5D%3C-%3E%5Bhooked%20wallet%20subprovider%5D%0A%20%20%5Bhooked%20wallet%20subprovider%5D%3C-%3E%5Bid%20store%5D%0A%20%20%5Bconfig%20manager%7C%0A%20%20%20%20%5Brpc%20configuration%5D%0A%20%20%20%20%5Bencrypted%20keys%5D%0A%20%20%20%20%5Bwallet%20nicknames%5D%0A%20%20%5D%0A%20%20%0A%20%20%5Bprovider-engine%5D%3C-%5Bconfig%20manager%5D%0A%20%20%5Bid%20store%5D%3C-%3E%5Bconfig%20manager%5D%0A%5D%0A%0A%5Buser%5D%3C-%3E%5Bmetamask-ui%5D%0A%0A%5Buser%5D%3C%3A--%3A%3E%5Bweb%20dapp%5D%0A%0A%5Bmetamask-contentscript%7C%0A%20%20%5Bplugin%20restart%20detector%5D%0A%20%20%5Brpc%20passthrough%5D%0A%5D%0A%0A%5Brpc%20%7C%0A%20%20%5Bethereum%20blockchain%20%7C%0A%20%20%20%20%5Bcontracts%5D%0A%20%20%20%20%5Baccounts%5D%0A%20%20%5D%0A%5D%0A%0A%5Bweb%20dapp%5D%3C%3A--%3A%3E%5Bmetamask-contentscript%5D%0A%5Bmetamask-contentscript%5D%3C-%3E%5Bmetamask-background%5D%0A%5Bmetamask-background%5D%3C-%3E%5Bmetamask-ui%5D%0A%5Bmetamask-background%5D%3C-%3E%5Brpc%5D%0A
