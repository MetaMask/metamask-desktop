window.trezorApi.initSetup((payload) => {
  window.TrezorConnect.on('DEVICE_EVENT', (deviceEvent) => {
    window.trezorApi.onDeviceEventResponse(deviceEvent);
  });

  window.TrezorConnect.init(payload).then((response) => {
    window.trezorApi.initResponse(response);
  });
});

window.trezorApi.disposeSetup(() => {
  window.TrezorConnect.dispose();
});

window.trezorApi.getPublicKeySetup((payload) => {
  window.TrezorConnect.getPublicKey(payload).then((response) => {
    window.trezorApi.getPublicKeyResponse(response);
  });
});

window.trezorApi.ethereumSignTransactionSetup((payload) => {
  window.TrezorConnect.ethereumSignTransaction(payload).then((response) => {
    window.trezorApi.ethereumSignTransactionResponse(response);
  });
});

window.trezorApi.ethereumSignMessageSetup((payload) => {
  window.TrezorConnect.ethereumSignMessage(payload).then((response) => {
    window.trezorApi.ethereumSignMessageResponse(response);
  });
});

window.trezorApi.ethereumSignTypedDataSetup((payload) => {
  window.TrezorConnect.ethereumSignTypedData(payload).then((response) => {
    window.trezorApi.ethereumSignTypedDataResponse(response);
  });
});
