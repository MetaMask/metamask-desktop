import { ipcRenderer } from 'electron';
// eslint-disable-next-line import/no-extraneous-dependencies
import TrezorConnectType from 'trezor-connect';

// TrezorConnect is injected as inline script in html
// therefore it doesn't need to included into node_modules
// get reference straight from window object
let TrezorConnect: typeof TrezorConnectType;

const onLoad = () => {
  ipcRenderer.on('trezor-connect-init', (_, payload) => {
    TrezorConnect.on('DEVICE_EVENT', (deviceEvent) => {
      ipcRenderer.send('trezor-connect-on-device-event', deviceEvent);
    });

    TrezorConnect.init(payload).then((response) => {
      ipcRenderer.send('trezor-connect-init-result', response);
    });
  });

  ipcRenderer.on('trezor-connect-dispose', () => {
    TrezorConnect.dispose();
  });

  ipcRenderer.on('trezor-connect-getPublicKey', (_, payload) => {
    TrezorConnect.getPublicKey(payload).then((response) => {
      ipcRenderer.send('trezor-connect-getPublicKey-result', response);
    });
  });

  ipcRenderer.on('trezor-connect-ethereumSignTransaction', (_, payload) => {
    TrezorConnect.ethereumSignTransaction(payload).then((response) => {
      ipcRenderer.send(
        'trezor-connect-ethereumSignTransaction-result',
        response,
      );
    });
  });

  ipcRenderer.on('trezor-connect-ethereumSignMessage', (_, payload) => {
    TrezorConnect.ethereumSignMessage(payload).then((response) => {
      ipcRenderer.send('trezor-connect-ethereumSignMessage-result', response);
    });
  });

  ipcRenderer.on('trezor-connect-ethereumSignTypedData', (_, payload) => {
    TrezorConnect.ethereumSignTypedData(payload).then((response) => {
      ipcRenderer.send('trezor-connect-ethereumSignTypedData-result', response);
    });
  });
};

const waitForTrezorConnect = (callback: () => void) => {
  const interval = setInterval(() => {
    if ((window as any).TrezorConnect) {
      TrezorConnect = (window as any).TrezorConnect;
      clearInterval(interval);
      callback();
    }
  }, 200);
};

window.addEventListener('DOMContentLoaded', () => {
  waitForTrezorConnect(onLoad);
});
