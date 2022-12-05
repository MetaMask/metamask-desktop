import { ipcMain } from 'electron';
import {
  TrezorBridge,
  TREZOR_CONNECT_MANIFEST,
  GetPublicKeyPayload,
  GetPublicKeyResponse,
  EthereumSignMessagePayload,
  EthereumSignMessageResponse,
  EthereumSignTransactionPayload,
  EthereumSignTransactionResponse,
  EthereumSignTypedDataPayload,
  EthereumSignTypedDataResponse,
} from 'eth-trezor-keyring';
import DesktopApp from '../../app/desktop-app';

export class TrezorBridgeDesktop implements TrezorBridge {
  public model: string | undefined;

  public init() {
    ipcMain.on(this._buildChannelName('on-device-event', true), (_, event) => {
      if (event?.payload?.features) {
        this.model = event.payload.features.model;
      }
    });

    return this._promisifyEvent<void>('init', {
      manifest: TREZOR_CONNECT_MANIFEST,
      webusb: false, // webusb is not supported in electron
      debug: false, // see whats going on inside iframe
      lazyLoad: true, // set to "false" (default) if you want to start communication with bridge on application start (and detect connected device right away)
      // set it to "true", then trezor-connect will not be initialized until you call some TrezorConnect.method()
      // this is useful when you don't know if you are dealing with Trezor user });
    });
  }

  public dispose() {
    DesktopApp.submitMessageToTrezorWindow(this._buildChannelName('dispose'));
    return Promise.resolve();
  }

  public getPublicKey(payload: GetPublicKeyPayload) {
    return this._promisifyEvent<GetPublicKeyResponse>('getPublicKey', payload);
  }

  public ethereumSignTransaction(payload: EthereumSignTransactionPayload) {
    return this._promisifyEvent<EthereumSignTransactionResponse>(
      'ethereumSignTransaction',
      payload,
    );
  }

  public ethereumSignMessage(payload: EthereumSignMessagePayload) {
    return this._promisifyEvent<EthereumSignMessageResponse>(
      'ethereumSignMessage',
      payload,
    );
  }

  public ethereumSignTypedData(payload: EthereumSignTypedDataPayload) {
    return this._promisifyEvent<EthereumSignTypedDataResponse>(
      'ethereumSignTypedData',
      payload,
    );
  }

  private _promisifyEvent<T>(identifier: string, payload: any): Promise<T> {
    return new Promise((resolve, reject) => {
      try {
        DesktopApp.submitMessageToTrezorWindow(
          this._buildChannelName(identifier),
          payload,
        );
      } catch (error) {
        reject(error);
      }

      ipcMain.on(this._buildChannelName(identifier, true), (_, result) => {
        resolve(result);
      });
    });
  }

  private _buildChannelName(identifier: string, isResponse = false) {
    return `trezor-connect-${identifier}${isResponse ? '-response' : ''}`;
  }
}
