import { Duplex } from 'stream';
import { BrowserWindow, ipcMain } from 'electron';
import log from 'loglevel';

export class IPCRendererStream extends Duplex {
  private window: BrowserWindow;

  private channel: string;

  constructor(window: BrowserWindow, channel: string) {
    super({ objectMode: true });

    this.window = window;
    this.channel = channel;

    ipcMain.on(this.channel, (_: any, data: any) => {
      this.onMessage(data);
    });
  }

  public _read() {
    return undefined;
  }

  public async _write(msg: any, _: string, cb: () => void) {
    log.debug('Sending message to renderer process', msg);
    this.window.webContents.send(this.channel, msg);
    cb();
  }

  private async onMessage(data: any) {
    log.debug('Received message from renderer process', data);
    this.push(data);
  }
}
