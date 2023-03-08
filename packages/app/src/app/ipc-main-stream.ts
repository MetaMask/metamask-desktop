import { Duplex } from 'stream';
import { PopupElectronBridge } from './ui/preload-popup';

export class IPCMainStream extends Duplex {
  private popupElectronBridge: PopupElectronBridge;

  constructor(popupElectronBridge: any) {
    super({ objectMode: true });

    this.popupElectronBridge = popupElectronBridge;

    popupElectronBridge.addBackgroundMessageListener((data: any) => {
      this.onMessage(data);
    });
  }

  public _read() {
    return undefined;
  }

  public async _write(msg: any, _: string, cb: () => void) {
    __electronLog.info('Sending message to main process', msg);
    await this.popupElectronBridge.sendBackgroundMessage(msg);
    cb();
  }

  private async onMessage(data: any) {
    __electronLog.info('Received message from main process', data);
    this.push(data);
  }
}
