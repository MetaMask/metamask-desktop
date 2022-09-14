import cfg from './config';
import { Browser } from './types/browser';

// eslint-disable-next-line import/no-mutable-exports
let browser: Browser;

if (cfg().desktop.isApp) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  browser = require('./node-browser').default;
} else {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  browser = require('webextension-polyfill');
}

export { browser };
