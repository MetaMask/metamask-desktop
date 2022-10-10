/* eslint-disable import/unambiguous */
const { ipcMain } = require('electron');
const TrezorKeyring = require('eth-trezor-keyring');

class TrezorKeyringElectron extends TrezorKeyring {
  constructor(opts = {}) {
    const TrezorConnect = {
      on(event, callback) {
        if (event === 'DEVICE_EVENT') {
          ipcMain.on('trezor-connect-on-device-event', (_, data) => {
            callback(data);
          });
        }
      },

      init(data) {
        return new Promise((resolve) => {
          ipcMain.emit('trezor-init', data);

          ipcMain.on('trezor-connect-init-result', (_, response) => {
            resolve(response);
          });
        });
      },

      dispose() {
        ipcMain.emit('trezor-dispose');
      },

      getPublicKey(data) {
        return new Promise((resolve) => {
          ipcMain.emit('trezor-getPublicKey', data);

          ipcMain.on('trezor-connect-getPublicKey-result', (_, response) => {
            resolve(response);
          });
        });
      },

      ethereumSignTransaction(data) {
        return new Promise((resolve) => {
          ipcMain.emit('trezor-ethereumSignTransaction', data);

          ipcMain.on(
            'trezor-connect-ethereumSignTransaction-result',
            (_, response) => {
              resolve(response);
            },
          );
        });
      },

      ethereumSignMessage(data) {
        return new Promise((resolve) => {
          ipcMain.emit('trezor-ethereumSignMessage', data);

          ipcMain.on(
            'trezor-connect-ethereumSignMessage-result',
            (_, response) => {
              resolve(response);
            },
          );
        });
      },

      ethereumSignTypedData(data) {
        return new Promise((resolve) => {
          ipcMain.emit('trezor-ethereumSignTypedData', data);

          ipcMain.on(
            'trezor-connect-ethereumSignTypedData-result',
            (_, response) => {
              resolve(response);
            },
          );
        });
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
