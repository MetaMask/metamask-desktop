const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Localization', function () {
  it('can correctly display Philippine peso symbol and code', async function () {
    const ganacheOptions = {
      accounts: [
        {
          secretKey:
            '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
          balance: convertToHexValue(25000000000000000000),
        },
      ],
    };
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withCurrencyController({
            currentCurrency: 'php',
          })
          .withPreferencesController({
            preferences: {
              showFiatInTestnets: true,
            },
          })
          .build(),
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);
        const secondaryBalance = await driver.findElement(
          '[data-testid="eth-overview__secondary-currency"]',
        );
        const secondaryBalanceText = await secondaryBalance.getText();
        const [fiatAmount, fiatUnit] = secondaryBalanceText
          .trim()
          .split(/\s+/u);
        assert.ok(fiatAmount.startsWith('₱'));
        assert.equal(fiatUnit, 'PHP');
      },
    );
  });
});
