const path = require('path');
const { promises: fs } = require('fs');
const BigNumber = require('bignumber.js');
const mockttp = require('mockttp');
const createStaticServer = require('../../development/create-static-server');
const enLocaleMessages = require('../../app/_locales/en/messages.json');
const { setupMocking } = require('./mock-e2e');
const Ganache = require('./ganache');
const FixtureServer = require('./fixture-server');
const PhishingWarningPageServer = require('./phishing-warning-page-server');
const { buildWebDriver } = require('./webdriver');
const { ensureXServerIsRunning } = require('./x-server');
const GanacheSeeder = require('./seeder/ganache-seeder');
const {
  isUsingDesktopApp,
  stopDesktopApp,
  startDesktopApp,
  setDesktopAppState,
} = require('./desktop');

const tinyDelayMs = 200;
const regularDelayMs = tinyDelayMs * 2;
const largeDelayMs = regularDelayMs * 2;
const veryLargeDelayMs = largeDelayMs * 2;
const dappBasePort = 8080;

const createDownloadFolder = async (downloadsFolder) => {
  await fs.rm(downloadsFolder, { recursive: true, force: true });
  await fs.mkdir(downloadsFolder, { recursive: true });
};

const convertToHexValue = (val) => `0x${new BigNumber(val, 10).toString(16)}`;

async function withFixtures(options, testSuite) {
  const {
    dapp,
    fixtures,
    ganacheOptions,
    smartContract,
    driverOptions,
    dappOptions,
    title,
    failOnConsoleError = true,
    dappPath = undefined,
    dappPaths,
    testSpecificMock = function () {
      // do nothing.
    },
  } = options;
  const fixtureServer = new FixtureServer();
  const ganacheServer = new Ganache();
  const https = await mockttp.generateCACertificate();
  const mockServer = mockttp.getLocal({ https, cors: true });
  let secondaryGanacheServer;
  let numberOfDapps = dapp ? 1 : 0;
  const dappServer = [];
  const phishingPageServer = new PhishingWarningPageServer();

  let webDriver;
  let driver;
  const errors = [];
  let failed = false;
  try {
    await ganacheServer.start(ganacheOptions);
    let contractRegistry;

    if (smartContract) {
      const ganacheSeeder = new GanacheSeeder(ganacheServer.getProvider());
      await ganacheSeeder.deploySmartContract(smartContract);
      contractRegistry = ganacheSeeder.getContractRegistry();
    }

    if (ganacheOptions?.concurrent) {
      const { port, chainId } = ganacheOptions.concurrent;
      secondaryGanacheServer = new Ganache();
      await secondaryGanacheServer.start({
        blockTime: 2,
        chain: { chainId },
        port,
        vmErrorsOnRPCResponse: false,
      });
    }
    await fixtureServer.start();

    if (isUsingDesktopApp()) {
      stopDesktopApp();
    }

    const state = fixtureServer.loadJsonState(fixtures);

    await setupMocking(mockServer, testSpecificMock);
    await mockServer.start(8000);

    if (isUsingDesktopApp()) {
      await setDesktopAppState(state);
      await startDesktopApp();
    }

    await phishingPageServer.start();
    if (dapp) {
      if (dappOptions?.numberOfDapps) {
        numberOfDapps = dappOptions.numberOfDapps;
      }
      for (let i = 0; i < numberOfDapps; i++) {
        let dappDirectory;
        if (dappPath || (dappPaths && dappPaths[i])) {
          dappDirectory = path.resolve(__dirname, dappPath || dappPaths[i]);
        } else {
          dappDirectory = path.resolve(
            __dirname,
            '..',
            '..',
            'node_modules',
            '@metamask',
            'test-dapp',
            'dist',
          );
        }
        dappServer.push(createStaticServer(dappDirectory));
        dappServer[i].listen(`${dappBasePort + i}`);
        await new Promise((resolve, reject) => {
          dappServer[i].on('listening', resolve);
          dappServer[i].on('error', reject);
        });
      }
    }

    if (
      process.env.SELENIUM_BROWSER === 'chrome' &&
      process.env.CI === 'true'
    ) {
      await ensureXServerIsRunning();
    }
    driver = (await buildWebDriver(driverOptions)).driver;
    webDriver = driver.driver;

    if (process.env.SELENIUM_BROWSER === 'chrome') {
      await driver.checkBrowserForExceptions();
    }

    await testSuite({
      driver,
      mockServer,
      contractRegistry,
    });

    // MMD

    if (!isUsingDesktopApp() && process.env.SELENIUM_BROWSER === 'chrome') {
      errors.concat(await driver.checkBrowserForConsoleErrors(driver));
      if (errors.length) {
        const errorReports = errors.map((err) => err.message);
        const errorMessage = `Errors found in browser console:\n${errorReports.join(
          '\n',
        )}`;
        if (failOnConsoleError) {
          throw new Error(errorMessage);
        } else {
          console.error(new Error(errorMessage));
        }
      }
    }
  } catch (error) {
    failed = true;
    if (webDriver) {
      try {
        await driver.verboseReportOnFailure(title);
      } catch (verboseReportError) {
        console.error(verboseReportError);
      }
      if (
        errors.length === 0 &&
        driver.exceptions.length > 0 &&
        failOnConsoleError
      ) {
        const errorMessage = `Errors found in browser console:\n${driver.exceptions.join(
          '\n',
        )}`;
        throw Error(errorMessage);
      }
    }
    throw error;
  } finally {
    if (!failed || process.env.E2E_LEAVE_RUNNING !== 'true') {
      await fixtureServer.stop();

      if (isUsingDesktopApp()) {
        stopDesktopApp();
      }

      await ganacheServer.quit();
      if (ganacheOptions?.concurrent) {
        await secondaryGanacheServer.quit();
      }
      if (webDriver) {
        await driver.quit();
      }
      if (dapp) {
        for (let i = 0; i < numberOfDapps; i++) {
          if (dappServer[i] && dappServer[i].listening) {
            await new Promise((resolve, reject) => {
              dappServer[i].close((error) => {
                if (error) {
                  return reject(error);
                }
                return resolve();
              });
            });
          }
        }
      }
      if (phishingPageServer.isRunning()) {
        await phishingPageServer.quit();
      }
      await mockServer.stop();
    }
  }
}

/**
 * @param {*} driver - selinium driver
 * @param {*} handlesCount - total count of windows that should be loaded
 * @returns handles - an object with window handles, properties in object represent windows:
 *            1. extension: metamask extension window
 *            2. dapp: test-app window
 *            3. popup: metsmask extension popup window
 */
const getWindowHandles = async (driver, handlesCount) => {
  await driver.waitUntilXWindowHandles(handlesCount);
  const windowHandles = await driver.getAllWindowHandles();

  const extension = windowHandles[0];
  const dapp = await driver.switchToWindowWithTitle(
    'E2E Test Dapp',
    windowHandles,
  );
  const popup = windowHandles.find(
    (handle) => handle !== extension && handle !== dapp,
  );
  return { extension, dapp, popup };
};

const completeImportSRPOnboardingFlow = async (
  driver,
  seedPhrase,
  password,
) => {
  if (process.env.ONBOARDING_V2 === '1') {
    // welcome
    await driver.clickElement('[data-testid="onboarding-import-wallet"]');

    // metrics
    await driver.clickElement('[data-testid="metametrics-no-thanks"]');

    // import with recovery phrase
    await driver.fill('[data-testid="import-srp-text"]', seedPhrase);
    await driver.clickElement('[data-testid="import-srp-confirm"]');

    // create password
    await driver.fill('[data-testid="create-password-new"]', password);
    await driver.fill('[data-testid="create-password-confirm"]', password);
    await driver.clickElement('[data-testid="create-password-terms"]');
    await driver.clickElement('[data-testid="create-password-import"]');

    // complete
    await driver.clickElement('[data-testid="onboarding-complete-done"]');

    // pin extension
    await driver.clickElement('[data-testid="pin-extension-next"]');
    await driver.clickElement('[data-testid="pin-extension-done"]');
  } else {
    // clicks the continue button on the welcome screen
    await driver.findElement('.welcome-page__header');
    await driver.clickElement({
      text: enLocaleMessages.getStarted.message,
      tag: 'button',
    });

    // clicks the "No thanks" option on the metametrics opt-in screen
    await driver.clickElement('.btn-secondary');

    // clicks the "Import Wallet" option
    await driver.clickElement({ text: 'Import wallet', tag: 'button' });

    // Import Secret Recovery Phrase
    await driver.pasteIntoField(
      '[data-testid="import-srp__srp-word-0"]',
      seedPhrase,
    );

    await driver.fill('#password', password);
    await driver.fill('#confirm-password', password);

    await driver.clickElement(
      '[data-testid="create-new-vault__terms-checkbox"]',
    );

    await driver.clickElement({ text: 'Import', tag: 'button' });

    // clicks through the success screen
    await driver.findElement({ text: 'Congratulations', tag: 'div' });
    await driver.clickElement({
      text: enLocaleMessages.endOfFlowMessage10.message,
      tag: 'button',
    });
  }
};

const completeImportSRPOnboardingFlowDesktop = async (
  driver,
  seedPhrase,
  password,
) => {
  await driver.clickElement({ text: 'I accept the risk', tag: 'button' });
  await driver.clickElement({ text: 'Import wallet', tag: 'button' });

  // Import Secret Recovery Phrase
  await driver.pasteIntoField(
    '[data-testid="import-srp__srp-word-0"]',
    seedPhrase,
  );

  await driver.fill('#password', password);
  await driver.fill('#confirm-password', password);

  await driver.clickElement('[data-testid="create-new-vault__terms-checkbox"]');

  await driver.clickElement({ text: 'Import', tag: 'button' });

  // clicks through the success screen
  await driver.findElement({ text: 'Congratulations', tag: 'div' });
  await driver.clickElement({
    text: enLocaleMessages.endOfFlowMessage10.message,
    tag: 'button',
  });
};

const completeImportSRPOnboardingFlowWordByWord = async (
  driver,
  seedPhrase,
  password,
) => {
  // clicks the continue button on the welcome screen
  await driver.findElement('.welcome-page__header');
  await driver.clickElement({
    text: enLocaleMessages.getStarted.message,
    tag: 'button',
  });

  // clicks the "No thanks" option on the metametrics opt-in screen
  await driver.clickElement('.btn-secondary');

  // clicks the "Import Wallet" option
  await driver.clickElement({ text: 'Import wallet', tag: 'button' });

  const words = seedPhrase.split(' ');
  for (const word of words) {
    await driver.pasteIntoField(
      `[data-testid="import-srp__srp-word-${words.indexOf(word)}"]`,
      word,
    );
  }

  await driver.fill('#password', password);
  await driver.fill('#confirm-password', password);

  await driver.clickElement('[data-testid="create-new-vault__terms-checkbox"]');

  await driver.clickElement({ text: 'Import', tag: 'button' });

  // clicks through the success screen
  await driver.findElement({ text: 'Congratulations', tag: 'div' });
  await driver.clickElement({
    text: enLocaleMessages.endOfFlowMessage10.message,
    tag: 'button',
  });
};

module.exports = {
  getWindowHandles,
  convertToHexValue,
  tinyDelayMs,
  regularDelayMs,
  largeDelayMs,
  veryLargeDelayMs,
  withFixtures,
  completeImportSRPOnboardingFlow,
  completeImportSRPOnboardingFlowDesktop,
  completeImportSRPOnboardingFlowWordByWord,
  createDownloadFolder,
};
