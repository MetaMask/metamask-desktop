/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable no-empty-pattern */
import * as path from 'path';
import { test as base, chromium, firefox, webkit } from '@playwright/test';
import Ganache from './ganache';

const extensionPath = path.join(__dirname, '../../../dist/chrome');
console.log(extensionPath);

const testExtension = base.extend({
  context: async ({ browserName }, use) => {
    const browserTypes = { chromium, firefox, webkit };
    const launchOptions = {
      headless: false,
      args: [`--disable-extensions-except=${extensionPath}`],
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
