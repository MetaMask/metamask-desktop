import * as path from 'path';
import { test as base, chromium, firefox, webkit } from '@playwright/test';
import Ganache from '../helpers/ganache';

const extensionPath = path.join(__dirname, '../../dist/chrome');
console.log(extensionPath);

const testExtension = base.extend({
  context: async ({ browserName }, use) => {
    const browserTypes = { chromium, firefox, webkit };
    const launchOptions = {
      //   devtools: true,
      headless: false,
      args: [`--disable-extensions-except=${extensionPath}`],
      //   viewport: {
      //     width: 1920,
      //     height: 1080
      //   },
      recordVideo: {
        dir: 'playwright/playwright-reports/test-artifacts/videos/',
      },
    };
    const context = await browserTypes[browserName].launchPersistentContext(
      '',
      launchOptions,
    );
    await use(context);
    await context.close();
  },
});

type GanacheWorkerFixtures = {
  ganache: Ganache;
};

const test = testExtension.extend<{}, GanacheWorkerFixtures>({
  // "express" fixture starts automatically for every worker - we pass "auto" for that.
  ganache: [
    async ({}, use) => {
      const ganacheOptions = {};

      const ganacheServer = new Ganache();
      console.log('Starting Ganache...');
      await ganacheServer.start(ganacheOptions);
      console.log('Ganache started');

      // Use the server in the tests.
      await use(ganacheServer);

      // Cleanup.
      console.log('Stopping Ganache...');
      await ganacheServer.quit();
      console.log('Ganache stopped');
    },
    { scope: 'worker', auto: true },
  ],
});

export default test;
