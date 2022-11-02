const { strict: assert } = require('assert');
const { promises: fs } = require('fs');
const {
  convertToHexValue,
  withFixtures,
  createDownloadFolder,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

const downloadsFolder = `${process.cwd()}/test-artifacts/downloads`;

const stateLogsExist = async () => {
  try {
    const stateLogs = `${downloadsFolder}/MetaMask state logs.json`;
    await fs.access(stateLogs);
    return true;
  } catch (e) {
    return false;
  }
};

describe('State logs', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('should download state logs for the account', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        title: this.test.title,
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await createDownloadFolder(downloadsFolder);
        if (process.env.RUN_WITH_DESKTOP === 'true') {
          await driver.navigate();
        }
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // Download state logs
        await driver.clickElement('.account-menu__icon');
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Advanced', tag: 'div' });
        await driver.clickElement({
          text: 'Download state logs',
          tag: 'button',
        });

        // Verify download
        let fileExists;
        await driver.wait(async () => {
          fileExists = await stateLogsExist();
          return fileExists === true;
        }, 10000);
        assert.equal(fileExists, true);
      },
    );
  });
});
