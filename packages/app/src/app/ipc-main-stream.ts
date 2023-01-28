import { Duplex } from 'stream';

export class IPCMainStream extends Duplex {
  private electronBridge: any;

  constructor(electronBridge: any) {
    super({ objectMode: true });

    this.electronBridge = electronBridge;

    electronBridge.addBackgroundMessageListener((data: any) => {
      this.onMessage(data);
    });
  }

  public _read() {
    return undefined;
  }

  public async _write(msg: any, _: string, cb: () => void) {
    __electronLog.info('Sending message to main process', msg);
    await this.electronBridge.sendBackgroundMessage(msg);
    cb();
  }

  private async onMessage(data: any) {
    __electronLog.info('Received message from main process', data);
    this.push(data);
  }
}
