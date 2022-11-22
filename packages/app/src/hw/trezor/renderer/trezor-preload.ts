import { contextBridge, ipcRenderer } from 'electron';

const channelPrefix = 'trezor-connect';
const responseSufix = 'response';

const buildChannelName = (identifier: string, isResponse = false) => {
  return `${channelPrefix}-${identifier}${
    isResponse ? `-${responseSufix}` : ''
  }`;
};

contextBridge.exposeInMainWorld('trezorApi', {
  initSetup: (callback: any) => {
    ipcRenderer.on(buildChannelName('init'), (_, payload) => {
      callback(payload);
    });
  },
  initResponse: (response: any) => {
    ipcRenderer.send(buildChannelName('init', true), response);
  },
  onDeviceEventResponse: (deviceEvent: any) => {
    ipcRenderer.send(buildChannelName('on-device-event', true), deviceEvent);
  },

  disposeSetup: (callback: any) => {
    ipcRenderer.on(buildChannelName('dispose'), () => {
      callback();
    });
  },

  getPublicKeySetup: (callback: any) => {
    ipcRenderer.on(buildChannelName('getPublicKey'), (_, payload) => {
      callback(payload);
    });
  },
  getPublicKeyResponse: (response: any) => {
    ipcRenderer.send(buildChannelName('getPublicKey', true), response);
  },

  ethereumSignTransactionSetup: (callback: any) => {
    ipcRenderer.on(
      buildChannelName('ethereumSignTransaction'),
      (_, payload) => {
        callback(payload);
      },
    );
  },
  ethereumSignTransactionResponse: (response: any) => {
    ipcRenderer.send(
      buildChannelName('ethereumSignTransaction', true),
      response,
    );
  },

  ethereumSignMessageSetup: (callback: any) => {
    ipcRenderer.on(buildChannelName('ethereumSignMessage'), (_, payload) => {
      callback(payload);
    });
  },
  ethereumSignMessageResponse: (response: any) => {
    ipcRenderer.send(buildChannelName('ethereumSignMessage', true), response);
  },

  ethereumSignTypedDataSetup: (callback: any) => {
    ipcRenderer.on(buildChannelName('ethereumSignTypedData'), (_, payload) => {
      callback(payload);
    });
  },
  ethereumSignTypedDataResponse: (response: any) => {
    ipcRenderer.send(buildChannelName('ethereumSignTypedData', true), response);
  },
});
