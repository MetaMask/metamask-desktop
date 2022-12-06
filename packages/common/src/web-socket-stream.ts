import { Duplex } from 'stream';
import { WebSocket as WSWebSocket } from 'ws';
import log from './utils/log';

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
        (event) => this.onMessage(event.data),
      );
    } else {
      (this.webSocket as NodeWebSocket).on('message', (message) =>
        this.onMessage(message),
      );
    }
  }

  public init() {
    // For consistency with EncryptedWebSocketStream to avoid further code branches
  }

  public _read() {
    return undefined;
  }

  public async _write(msg: any, _: string, cb: () => void) {
    log.debug('Sending message to web socket');

    const rawData = typeof msg === 'string' ? msg : JSON.stringify(msg);

    this.waitForSocketConnection(this.webSocket, () => {
      this.webSocket.send(rawData);
      cb();
    });
  }

  private async onMessage(rawData: any) {
    let data = rawData;

    try {
      data = JSON.parse(data);
    } catch {
      // Ignore as data is not a serialised object
    }

    log.debug('Received web socket message');

    this.push(data);
  }

  private waitForSocketConnection(
    socket: BrowserWebSocket | NodeWebSocket,
    callback: () => void,
  ) {
    if (socket.readyState === 1) {
      callback();
      return;
    }

    setTimeout(() => {
      this.waitForSocketConnection(socket, callback);
    }, 500);
  }
}
