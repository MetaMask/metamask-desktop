import * as path from 'path';
import { test as base, chromium, firefox, webkit } from '@playwright/test';

const extensionPath = path.join(__dirname, '../../dist/chrome');

export const test = base.extend({
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
