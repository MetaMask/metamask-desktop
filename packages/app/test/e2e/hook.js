/* eslint-disable node/no-unpublished-require */

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

    async getAllWindowHandles() {
      const handles = await driverGetWindowsHook();

      if (handles) {
        return handles;
      }

      return await super.getAllWindowHandles();
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
      helpersWithFixturesHook(...args);
      await originalWithFixtures(...args);
    },
  };

  mock('../../submodules/extension/test/e2e/helpers', mockHelpers);
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

helpersWithFixturesHook.callsFake((options) => {
  currentTestTitle = options.title;
});
