import cfg from './config';

let browser;

if(cfg().desktop.isApp) {
    browser = require('./node-browser');
} else {
    browser = require('webextension-polyfill');
}

module.exports = browser;
