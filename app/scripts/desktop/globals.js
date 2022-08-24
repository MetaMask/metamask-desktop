import cfg from './config';

if (cfg().desktop.isApp) {
  global.self = {};

  global.crypto = {
    // eslint-disable-next-line node/global-require
    getRandomValues: require('polyfill-crypto.getrandomvalues'),
    // Ternary prevents LavaMoat failing as the library can't be found
    // eslint-disable-next-line
    subtle: require(cfg().desktop.isApp ? `node:crypto` : ``).webcrypto.subtle,
  };

  global.window = {
    navigator: {
      userAgent: 'Firefox',
    },
    postMessage: () => undefined,
  };
}
