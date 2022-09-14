import { Duplex } from 'stream';
import log from 'loglevel';
import { WebSocket as WSWebSocket } from 'ws';

export type BrowserWebSocket = WebSocket;
export type NodeWebSocket = WSWebSocket;

export class WebSocketStream extends Duplex {
  private webSocket: BrowserWebSocket | NodeWebSocket;

  private isBrowser: boolean;

  constructor(webSocket: BrowserWebSocket | NodeWebSocket) {
    super({ objectMode: true });

    this.webSocket = webSocket;
    this.isBrowser = !(this.webSocket as any).on;

    if (this.isBrowser) {
      (this.webSocket as BrowserWebSocket).addEventListener(
        'message',
        (event) => this._onMessage(event.data),
      );
    } else {
      (this.webSocket as NodeWebSocket).on('message', (message) =>
        this._onMessage(message),
      );
    }
  }

  init() {
    // For consistency with EncryptedWebSocketStream to avoid further code branches
  }

  async _onMessage(rawData: any) {
    let data = rawData;

    try {
      data = JSON.parse(data);
    } catch {
      // Ignore as data is not a serialised object
    }

    log.debug('Received web socket message');

    this.push(data);
  }

  _read() {
    return undefined;
  }

  async _write(msg: any, _: string, cb: () => void) {
    log.debug('Sending message to web socket');

    const rawData = typeof msg === 'string' ? msg : JSON.stringify(msg);

    if (this.isBrowser) {
      this._sendBrowser(rawData, cb);
      return;
    }

    this.webSocket.send(rawData);
    cb();
  }

  _sendBrowser(rawData: string, cb: () => void) {
    this._waitForSocketConnection(this.webSocket as BrowserWebSocket, () => {
      this.webSocket.send(rawData);
      cb();
    });
  }

  _waitForSocketConnection(socket: BrowserWebSocket, callback: () => void) {
    if (socket.readyState === 1) {
      callback();
      return;
    }

    setTimeout(() => {
      this._waitForSocketConnection(socket, callback);
    }, 500);
  }
}
