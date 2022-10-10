/* eslint-disable import/unambiguous */
const { ipcMain } = require('electron');
const TrezorKeyring = require('eth-trezor-keyring');
const Desktop = require('../desktop').default;

function promisifyEvent(identifier, payload) {
  return new Promise((resolve, reject) => {
    if (!Desktop.hasInstance()) {
      reject(new Error('No Desktop instance'));
    }

    const channel = `trezor-connect-${identifier}`;

    const desktop = Desktop.getInstance();

    try {
      desktop.submitMessageToTrezorWindow(channel, payload);
    } catch (error) {
      reject(error);
    }

    ipcMain.on(`${channel}-result`, (_, result) => {
      resolve(result);
    });
  });
}

class TrezorKeyringElectron extends TrezorKeyring {
  constructor(opts = {}) {
    const TrezorConnect = {
      on(event, callback) {
        if (event === 'DEVICE_EVENT') {
          ipcMain.on('trezor-connect-on-device-event', (_, message) => {
            callback(message);
          });
        }
      },

      init(payload) {
        return promisifyEvent('init', payload);
      },

      dispose() {
        if (!Desktop.hasInstance()) {
          throw new Error('No Desktop instance');
        }

        const { trezorWindow } = Desktop.getInstance();
        trezorWindow.webContents.send('trezor-connect-dispose');
      },

      getPublicKey(payload) {
        return promisifyEvent('getPublicKey', payload);
      },

      ethereumSignTransaction(payload) {
        return promisifyEvent('ethereumSignTransaction', payload);
      },

      ethereumSignMessage(payload) {
        return promisifyEvent('ethereumSignTransaction', payload);
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
