import { ipcRenderer } from 'electron';
import { buildChannelName } from './build-channel-name';

// TrezorConnect is injected as inline script in html
// therefore it doesn't need to included into node_modules
// get reference straight from window object
let TrezorConnect: any;

const onLoad = () => {
  ipcRenderer.on(buildChannelName('init'), (_, payload) => {
    TrezorConnect.on('DEVICE_EVENT', (deviceEvent: any) => {
      ipcRenderer.send(buildChannelName('on-device-event', true), deviceEvent);
    });

    TrezorConnect.init(payload).then((response: any) => {
      ipcRenderer.send(buildChannelName('init', true), response);
    });
  });

  ipcRenderer.on(buildChannelName('dispose'), () => {
    TrezorConnect.dispose();
  });

  ipcRenderer.on(buildChannelName('getPublicKey'), (_, payload) => {
    TrezorConnect.getPublicKey(payload).then((response: any) => {
      ipcRenderer.send(buildChannelName('getPublicKey', true), response);
    });
  });

  ipcRenderer.on(buildChannelName('ethereumSignTransaction'), (_, payload) => {
    TrezorConnect.ethereumSignTransaction(payload).then((response: any) => {
      ipcRenderer.send(
        buildChannelName('ethereumSignTransaction', true),
        response,
      );
    });
  });

  ipcRenderer.on(buildChannelName('ethereumSignMessage'), (_, payload) => {
    TrezorConnect.ethereumSignMessage(payload).then((response: any) => {
      ipcRenderer.send(buildChannelName('ethereumSignMessage', true), response);
    });
  });

  ipcRenderer.on(buildChannelName('ethereumSignTypedData'), (_, payload) => {
    TrezorConnect.ethereumSignTypedData(payload).then((response: any) => {
      ipcRenderer.send(
        buildChannelName('ethereumSignTypedData', true),
        response,
      );
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
