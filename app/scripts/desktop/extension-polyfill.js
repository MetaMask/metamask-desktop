import cfg from './config';

// eslint-disable-next-line import/no-mutable-exports
let browser;

if (cfg().desktop.isApp) {
  // eslint-disable-next-line node/global-require
  browser = require('./node-browser').default;
} else {
  // eslint-disable-next-line node/global-require
  browser = require('webextension-polyfill');
}

export { browser };
