/* eslint-disable import/unambiguous */
const LatticeKeyring = require('eth-lattice-keyring');
const { ipcMain } = require('electron');
const Desktop = require('../../app/desktop-app').default;

class LatticeKeyringElectron extends LatticeKeyring {
  constructor(opts = {}) {
    super(opts);
  }

  async _openConnectorTab(url) {
    try {
      // send a msg to the render process to open lattice connector
      const browserTab = await new Promise((resolve, reject) => {
        try {
          Desktop.submitMessageToLatticeWindow('lattice-open-window', url);
        } catch (error) {
          reject(error);
        }

        ipcMain.on('lattice-open-window-response', (_, response) => {
          if (response.error) {
            return reject(response.error);
          }
          return resolve(response.result);
        });
      });
      return browserTab;
    } catch (err) {
      throw new Error('Failed to open Lattice connector.');
    }
  }

  async _getCreds() {
    try {
      // We only need to setup if we don't have a deviceID
      if (this._hasCreds()) {
        return;
      }
      // If we are not aware of what Lattice we should be talking to,
      // we need to open a window that lets the user go through the
      // pairing or connection process.

      const name = this.appName ? this.appName : 'Unknown';
      const base = 'https://lattice.gridplus.io';
      const url = `${base}?keyring=${name}&forceLogin=true`; // Open the tab

      await this._openConnectorTab(url);
    } catch (err) {
      throw new Error(err);
    }
  }
}

LatticeKeyringElectron.type = LatticeKeyring.type;
module.exports = LatticeKeyringElectron;
