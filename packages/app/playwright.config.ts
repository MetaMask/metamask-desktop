import path from 'path';
import { PlaywrightTestConfig } from '@playwright/test';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
require('dotenv').config({
  path: path.join(process.cwd(), '.env.test.e2e'),
  override: true,
});

const PW_ROOT_PATH = './test/playwright';

const config: PlaywrightTestConfig = {
  testDir: `${PW_ROOT_PATH}/specs`,
  timeout: 120 * 1000,
  workers: 1,
  retries: process.env.CI ? 2 : 0,

  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 20 * 1000,
  },

  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 10000,
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on',
    launchOptions: { args: [] },
  },

  reporter: [
    ['line'],
    [
      'html',
      {
        open: process.env.CI ? 'never' : 'on-failure',
        outputFolder: `${PW_ROOT_PATH}/playwright-reports/html/`,
      },
    ],
    [
      'junit',
      {
        outputFile: `${PW_ROOT_PATH}/playwright-reports/junit/test-results.xml`,
      },
    ],
  ],
};

export default config;
