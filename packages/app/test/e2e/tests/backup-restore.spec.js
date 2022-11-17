const { strict: assert } = require('assert');
const { promises: fs } = require('fs');
const path = require('path');
const {
  convertToHexValue,
  withFixtures,
  createDownloadFolder,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

const downloadsFolder = `${process.cwd()}/test-artifacts/downloads`;

const backupExists = async () => {
  const date = new Date();

  const prependZero = (num, maxLength) => {
    return num.toString().padStart(maxLength, '0');
  };

  const prefixZero = (num) => prependZero(num, 2);

  /*
   * userData.YYYY_MM_DD_HH_mm_SS e.g userData.2022_01_13_13_45_56
   * */
  const userDataFileName = `MetaMaskUserData.${date.getFullYear()}_${prefixZero(
    date.getMonth() + 1,
  )}_${prefixZero(date.getDay())}_${prefixZero(date.getHours())}_${prefixZero(
    date.getMinutes(),
  )}_${prefixZero(date.getDay())}.json`;

  try {
    const backup = `${downloadsFolder}/${userDataFileName}`;
    await fs.access(backup);
    return true;
  } catch (e) {
    return false;
  }
};

const restoreFile = path.join(
  __dirname,
  '..',
  'restore',
  'MetaMaskUserData.json',
);

describe('Backup and Restore', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('should backup the account settings', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        title: this.test.title,
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await createDownloadFolder(downloadsFolder);

        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // Download user settings
        await driver.clickElement('.account-menu__icon');
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Advanced', tag: 'div' });
        await driver.clickElement({
          text: 'Backup',
          tag: 'button',
        });

        // Verify download
        let fileExists;
        await driver.wait(async () => {
          fileExists = await backupExists();
          return fileExists === true;
        }, 10000);
        assert.equal(fileExists, true);
      },
    );
  });

  it('should restore the account settings', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // Restore
        await driver.clickElement('.account-menu__icon');
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Advanced', tag: 'div' });
        const restore = await driver.findElement('#restore-file');
        await restore.sendKeys(restoreFile);

        // Dismiss success message
        await driver.waitForSelector({
          css: '.actionable-message__message',
          text: 'Your data has been restored successfully',
        });
        await driver.clickElement({ text: 'Dismiss', tag: 'button' });

        // Verify restore
        await driver.clickElement({ text: 'Contacts', tag: 'div' });
        const recipient = await driver.findElement('[data-testid="recipient"]');
        assert.ok(
          /Test\sAccount\s*0x0c54...AaFb/u.test(await recipient.getText()),
        );
      },
    );
  });
});
