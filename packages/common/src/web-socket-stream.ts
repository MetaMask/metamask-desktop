import { Duplex } from 'stream';
import { WebSocket as WSWebSocket } from 'ws';
import log from './utils/log';
import { timeoutPromise } from './utils/utils';

const INTERVAL_WAIT_FOR_CONNECTED = 500;
const TIMEOUT_WAIT_FOR_CONNECTED = 3000;

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

    try {
      await this.waitForSocketConnected(this.webSocket);
    } catch (error) {
      log.error('Timeout waiting for web socket to be writable');
      cb();
      return;
    }

    this.webSocket.send(rawData);
    cb();
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

  private async waitForSocketConnected(
    socket: BrowserWebSocket | NodeWebSocket,
  ): Promise<void> {
    let interval: any;

    return timeoutPromise(
      new Promise<void>((resolve) => {
        const isReady = () => socket.readyState === 1;

        if (isReady()) {
          resolve();
          return;
        }

        interval = setInterval(() => {
          if (isReady()) {
            clearInterval(interval);
            resolve();
          }
        }, INTERVAL_WAIT_FOR_CONNECTED);
      }),
      TIMEOUT_WAIT_FOR_CONNECTED,
      {
        cleanUp: () => {
          if (interval) {
            clearInterval(interval);
          }
        },
      },
    );
  }
}
