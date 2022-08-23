import cfg from './config';

if(cfg().desktop.isApp) {
    global.self = {};

    global.crypto = {
        getRandomValues: require('polyfill-crypto.getrandomvalues'),
        // Ternary prevents LavaMoat failing as the library can't be found
        subtle: require(cfg().desktop.isApp ? 'node:crypto' : '').webcrypto.subtle
    };

    global.window = {
        crypto: global.crypto,
        navigator: {
            userAgent: 'Firefox'
        },
        postMessage: () => {}
    };
}
