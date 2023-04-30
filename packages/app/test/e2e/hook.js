/* eslint-disable node/no-unpublished-require */

const SKIPPED_TESTS = [
  // Flaky in metamask-extension
  'Add a custom network and then delete that same network',
];

const dns = require('node:dns');

// There is an issue with node 18 where it will
// auto resolve to ipv6 first first.
// This causes localhost connections to fail.
// As localhost resolves to ::1:<port> instead of 127.0.0.1:<port>
// see this - https://github.com/nodejs/node/issues/40702
// and this - https://github.com/node-fetch/node-fetch/issues/1624
// To be removed once we are using node 20
dns.setDefaultResultOrder('ipv4first');

const mockttp = require('mockttp');
const mock = require('mock-require');
const sinon = require('sinon');
const FixtureServer = require('../../submodules/extension/test/e2e/fixture-server');
const Driver = require('../../submodules/extension/test/e2e/webdriver/driver');
const FixtureBuilder = require('../../submodules/extension/test/e2e/fixture-builder');
const helper = require('./helper');

const fixtureBuilderBeforeBuildHook = sinon.stub();
const fixtureServerAfterStartHook = sinon.stub();
const fixtureServerAfterStopHook = sinon.stub();
const fixtureServerBeforeLoadStateHook = sinon.stub();
const mockServerAfterStartHook = sinon.stub();
const driverBeforeNavigateHook = sinon.stub();
const driverAfterNavigateHook = sinon.stub();
const driverGetWindowsHook = sinon.stub();
const driverCheckConsoleErrorsHook = sinon.stub();
const driverFindElementHook = sinon.stub();
const helpersWithFixturesHook = sinon.stub();

const registerFixtureBuilderHooks = () => {
  class DesktopFixtureBuilder extends FixtureBuilder {
    build() {
      const state = super.build();
      return fixtureBuilderBeforeBuildHook(state);
    }
  }

  mock(
    '../../submodules/extension/test/e2e/fixture-builder',
    DesktopFixtureBuilder,
  );
};

const registerFixtureServerHooks = () => {
  class DesktopFixtureServer extends FixtureServer {
    async start() {
      await super.start();
      await fixtureServerAfterStartHook();
    }

    async stop() {
      await super.stop();
      await fixtureServerAfterStopHook();
    }

    loadJsonState(...args) {
      fixtureServerBeforeLoadStateHook(args[0]);
      return super.loadJsonState(...args);
    }
  }

  mock(
    '../../submodules/extension/test/e2e/fixture-server',
    DesktopFixtureServer,
  );
};

const registerMockServerHooks = () => {
  const originalMockttpGetLocal = mockttp.getLocal;

  const mockGetLocal = (...args) => {
    const instance = originalMockttpGetLocal(...args);
    const originalStart = instance.start.bind(instance);

    instance.start = async (...args2) => {
      await originalStart(...args2);
      await mockServerAfterStartHook();
    };

    return instance;
  };

  mock('mockttp', { ...mockttp, getLocal: mockGetLocal });
};

const registerDriverHooks = () => {
  class DesktopDriver extends Driver {
    constructor(driver, browser, extensionUrl) {
      const originalGetAllWindowHandles =
        driver.getAllWindowHandles.bind(driver);

      driver.getAllWindowHandles = async () => {
        const handles = await driverGetWindowsHook();

        if (handles) {
          return handles;
        }

        return await originalGetAllWindowHandles();
      };

      const testPath = process.argv[9];
      const timeout = testPath.includes('from-import-ui') ? 120000 : 30000;

      super(driver, browser, extensionUrl, timeout);
    }

    async navigate(...args) {
      await driverBeforeNavigateHook(this);
      await super.navigate(...args);
      await driverAfterNavigateHook(this);
    }

    // eslint-disable-next-line no-empty-function
    async checkBrowserForConsoleErrors() {
      const errors = await driverCheckConsoleErrorsHook();

      if (errors !== undefined) {
        return errors;
      }

      return super.checkBrowserForConsoleErrors();
    }

    async findElement(rawLocator) {
      const result = await driverFindElementHook(rawLocator);

      if (result) {
        return result;
      }

      return super.findElement(rawLocator);
    }
  }

  mock('../../submodules/extension/test/e2e/webdriver/driver', DesktopDriver);
};

const registerHelpersHooks = () => {
  // eslint-disable-next-line node/global-require
  const helpers = require('../../submodules/extension/test/e2e/helpers');

  const originalWithFixtures = helpers.withFixtures.bind(helpers);

  const mockHelpers = {
    ...helpers,
    withFixtures: async (...args) => {
      if (!helpersWithFixturesHook(...args)) {
        return;
      }

      await originalWithFixtures(...args);
    },
  };

  mock('../../submodules/extension/test/e2e/helpers', mockHelpers);
};

const getStubCallCountWithArgs = (stub, args) => {
  return stub
    .getCalls()
    .filter(
      (call) =>
        call.args.length === args.length &&
        call.args.every((arg, index) => args[index] === arg),
    ).length;
};

registerFixtureBuilderHooks();
registerFixtureServerHooks();
registerMockServerHooks();
registerDriverHooks();
registerHelpersHooks();

// eslint-disable-next-line no-undef
before(function () {
  console.log('Detected desktop hook');
});

let currentState;
let currentTestTitle;

fixtureBuilderBeforeBuildHook.callsFake((state) => {
  return helper.addDesktopState(state);
});

fixtureServerAfterStartHook.callsFake(() => {
  helper.stopDesktopApp();
});

fixtureServerAfterStopHook.callsFake(() => {
  helper.stopDesktopApp();
});

fixtureServerBeforeLoadStateHook.callsFake((state) => {
  currentState = state;
});

mockServerAfterStartHook.callsFake(async () => {
  await helper.setDesktopAppState(currentState);
  await helper.startDesktopApp();
});

driverBeforeNavigateHook.callsFake(async (driver) => {
  await helper.beforeDesktopNavigate(driver);
});

driverAfterNavigateHook.callsFake(async (driver) => {
  await helper.afterDesktopNavigate(driver);
});

driverGetWindowsHook.callsFake(() => {
  if (
    currentTestTitle &&
    currentTestTitle.includes('Connects to a Hardware wallet')
  ) {
    const electronWindowCount = helper.getElectronWindowCount() - 1;
    return Array.from({ length: electronWindowCount }, (_, i) => i);
  }

  return undefined;
});

driverCheckConsoleErrorsHook.callsFake(() => []);

driverFindElementHook.callsFake(async (rawLocator) => {
  // The address book delete test finds the deleted contact immediately after clicking delete
  // but the pipeline with the app is too slow so the contact element has already gone.
  // We essentially skip this find by passing the same CSS string selector to isElementPresent.

  const DELETE_CONTACT_SELECTOR = '.send__select-recipient-wrapper__group-item';

  if (
    currentTestTitle &&
    currentTestTitle === 'Deletes existing entry from address book' &&
    rawLocator === DELETE_CONTACT_SELECTOR &&
    getStubCallCountWithArgs(driverFindElementHook, [
      DELETE_CONTACT_SELECTOR,
    ]) === 1
  ) {
    return DELETE_CONTACT_SELECTOR;
  }

  return undefined;
});

helpersWithFixturesHook.callsFake((options) => {
  currentTestTitle = options.title;

  if (SKIPPED_TESTS.includes(options.title)) {
    console.log('Skipping test as using desktop app');
    return false;
  }

  return true;
});
