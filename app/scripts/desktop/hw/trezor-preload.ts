import { ipcRenderer } from 'electron';

// TrezorConnect is injected as inline script in html
// therefore it doesn't need to included into node_modules
// get reference straight from window object
let TrezorConnect: any;

// print log helper
const printLog = (data: any) => {
  const log: any = document.getElementById('log');
  const current = log?.value;
  if (current.length > 0) {
    log.value = `${JSON.stringify(data)}\n\n${current}`;
  } else {
    log.value = JSON.stringify(data);
  }
};

const setupTrezorConnect = () => {
  // Listen to DEVICE_EVENT
  // this event will be emitted only after user grants permission to communicate with this app
  TrezorConnect.on('DEVICE_EVENT', (event: any) => {
    printLog(event);
  });

  // Initialize TrezorConnect
  TrezorConnect.init({
    webusb: false, // webusb is not supported in electron
    debug: false, // see whats going on inside iframe
    lazyLoad: true, // set to "false" (default) if you want to start communication with bridge on application start (and detect connected device right away)
    // set it to "true", then trezor-connect will not be initialized until you call some TrezorConnect.method()
    // this is useful when you don't know if you are dealing with Trezor user
    manifest: {
      email: 'email@developer.com',
      appUrl: 'electron-app-boilerplate',
    },
  })
    .then(() => {
      printLog('TrezorConnect is ready!');
      ipcRenderer.send('trezor-connect', 'TrezorConnect ready');
    })
    .catch((error: any) => {
      printLog(`TrezorConnect init error: ${error}`);
    });
};

const onLoad = () => {
  setupTrezorConnect();

  // click to get public key
  const btn = document.getElementById('get-xpub');
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  btn!.onclick = () => {
    TrezorConnect.getPublicKey({
      path: "m/44'/60'/0'/0",
      coin: 'eth',
    }).then((response: any) => {
      printLog(response);
      ipcRenderer.send('trezor-connect', response);
    });
  };

  ipcRenderer.on('trezor-connect-getPublicKey', (event, payload) => {
    console.log('TREZORCONNECT getPublicKey', event, payload);
    TrezorConnect.getPublicKey(payload).then((response: any) => {
      printLog(response);
      ipcRenderer.send('trezor-connect-getPublicKey-result', response);
    });
  });

  ipcRenderer.on('trezor-connect-ethereumSignTransaction', (event, payload) => {
    console.log('TREZORCONNECT ethereumSignTransaction', event, payload);
    TrezorConnect.ethereumSignTransaction(payload).then((response: any) => {
      printLog(response);
      ipcRenderer.send(
        'trezor-connect-ethereumSignTransaction-result',
        response,
      );
    });
  });

  ipcRenderer.on('trezor-connect-ethereumSignMessage', (event, payload) => {
    console.log('TREZORCONNECT ethereumSignMessage', event, payload);
    TrezorConnect.ethereumSignMessage(payload).then((response: any) => {
      printLog(response);
      ipcRenderer.send('trezor-connect-ethereumSignMessage-result', response);
    });
  });

  ipcRenderer.on('trezor-connect-ethereumSignTypedData', (event, payload) => {
    console.log('TREZORCONNECT ethereumSignTypedData', event, payload);
    TrezorConnect.ethereumSignTypedData(payload).then((response: any) => {
      printLog(response);
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
