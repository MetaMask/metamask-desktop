/* eslint-disable import/unambiguous */
// eslint-disable-next-line node/no-unpublished-require
const { ipcMain } = require('electron');
const TrezorKeyring = require('eth-trezor-keyring');
const { DEVICE_EVENT } = require('eth-trezor-keyring');
// eslint-disable-next-line import/no-unresolved
const Desktop = require('../../app/desktop-app').default;

const channelPrefix = 'trezor-connect';
const responseSufix = 'response';

const buildChannelName = (identifier, isResponse = false) => {
  return `${channelPrefix}-${identifier}${
    isResponse ? `-${responseSufix}` : ''
  }`;
};

// eslint-disable-next-line jsdoc/require-jsdoc
function promisifyEvent(identifier, payload) {
  return new Promise((resolve, reject) => {
    try {
      Desktop.submitMessageToTrezorWindow(
        buildChannelName(identifier),
        payload,
      );
    } catch (error) {
      reject(error);
    }

    ipcMain.on(buildChannelName(identifier, true), (_, result) => {
      resolve(result);
    });
  });
}

class TrezorKeyringElectron extends TrezorKeyring {
  constructor(opts = {}) {
    const TrezorConnect = {
      on(event, callback) {
        if (event === DEVICE_EVENT) {
          ipcMain.on(
            buildChannelName('on-device-event', true),
            (_, deviceEvent) => {
              callback(deviceEvent);
            },
          );
        }
      },

      init(payload) {
        return promisifyEvent('init', payload);
      },

      dispose() {
        Desktop.submitMessageToTrezorWindow(buildChannelName('dispose'));
      },

      getPublicKey(payload) {
        return promisifyEvent('getPublicKey', payload);
      },

      ethereumSignTransaction(payload) {
        return promisifyEvent('ethereumSignTransaction', payload);
      },

      ethereumSignMessage(payload) {
        return promisifyEvent('ethereumSignMessage', payload);
      },

      ethereumSignTypedData(payload) {
        return promisifyEvent('ethereumSignTypedData', payload);
      },
    };

    super({
      ...opts,
      trezorConnectOverride: TrezorConnect,
      trezorConnectInitOverride: {
        webusb: false, // webusb is not supported in electron
        debug: false, // see whats going on inside iframe
        lazyLoad: true, // set to "false" (default) if you want to start communication with bridge on application start (and detect connected device right away)
        // set it to "true", then trezor-connect will not be initialized until you call some TrezorConnect.method()
        // this is useful when you don't know if you are dealing with Trezor user
      },
    });
  }
}

TrezorKeyringElectron.type = TrezorKeyring.type;
module.exports = TrezorKeyringElectron;
