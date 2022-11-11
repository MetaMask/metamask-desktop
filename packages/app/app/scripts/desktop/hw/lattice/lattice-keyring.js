/* eslint-disable import/unambiguous */
const LatticeKeyring = require('eth-lattice-keyring');
const { ipcMain } = require('electron');
const Desktop = require('../../app/desktop-app').default;

class LatticeKeyringElectron extends LatticeKeyring {
  constructor(opts = {}) {
    super(opts);
  }

  async _getCreds() {
    try {
      // If we are not aware of what Lattice we should be talking to,
      // we need to open a window that lets the user go through the
      // pairing or connection process.
      const name = this.appName ? this.appName : 'Unknown';
      const base = 'https://lattice.gridplus.io';
      const url = `${base}?keyring=${name}&forceLogin=true`;

      // send a msg to the render process to open lattice connector
      // and collect the credentials
      const creds = await new Promise((resolve, reject) => {
        try {
          Desktop.submitMessageToLatticeWindow('lattice-credentials', url);
        } catch (error) {
          reject(error);
        }

        ipcMain.on('lattice-credentials-response', (_, response) => {
          if (response.error) {
            return reject(response.error);
          }
          return resolve(response.result);
        });
      });

      return creds;
    } catch (err) {
      throw new Error(err);
    }
  }
}

LatticeKeyringElectron.type = LatticeKeyring.type;
module.exports = LatticeKeyringElectron;
