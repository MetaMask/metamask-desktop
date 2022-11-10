const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Settings', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };

  it('checks jazzicon and blockies icons', async function () {
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

        // goes to the settings screen
        await driver.clickElement('.account-menu__icon');
        await driver.clickElement({ text: 'Settings', tag: 'div' });

        // finds the jazzicon toggle turned on
        await driver.findElement(
          '[data-test-id="jazz_icon"] .settings-page__content-item__identicon__item__icon--active',
        );

        const jazziconText = await driver.findElement({
          tag: 'h6',
          text: 'Jazzicons',
        });
        assert.equal(
          await jazziconText.getText(),
          'Jazzicons',
          'Text for icon should be Jazzicons',
        );

        const blockiesText = await driver.findElement({
          tag: 'h6',
          text: 'Blockies',
        });
        assert.equal(
          await blockiesText.getText(),
          'Blockies',
          'Text for icon should be Blockies',
        );
      },
    );
  });
});
