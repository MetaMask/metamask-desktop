// eslint-disable-next-line node/no-extraneous-require
const ElectronStore = window.require('electron-store');

export default function createElectronStorage(electronStoreOpts) {
  const storage = new ElectronStore(electronStoreOpts);
  return {
    getItem: (key) => {
      return new Promise((resolve) => {
        resolve(storage.get(key));
      });
    },
    setItem: (key, item) => {
      return new Promise((resolve) => {
        resolve(storage.set(key, item));
      });
    },
    removeItem: (key) => {
      return new Promise((resolve) => {
        resolve(storage.delete(key));
      });
    },
  };
}
