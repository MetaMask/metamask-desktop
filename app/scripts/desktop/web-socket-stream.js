import { Duplex } from 'stream';
import log from 'loglevel';

export default class WebSocketStream extends Duplex {
  constructor(webSocket) {
    super({ objectMode: true });

    this._webSocket = webSocket;
    this._isBrowser = !this._webSocket.on;

    if (this._isBrowser) {
      this._webSocket.addEventListener('message', (event) =>
        this._onMessage(event.data),
      );
    } else {
      this._webSocket.on('message', (message) => this._onMessage(message));
    }
  }

  async _onMessage(rawData) {
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

  async _write(msg, _, cb) {
    log.debug('Sending message to web socket');

    const rawData = typeof msg === 'string' ? msg : JSON.stringify(msg);

    if (this._isBrowser) {
      this._sendBrowser(rawData, cb);
      return;
    }

    this._webSocket.send(rawData);
    cb();
  }

  _sendBrowser(rawData, cb) {
    this._waitForSocketConnection(this._webSocket, () => {
      this._webSocket.send(rawData);
      cb();
    });
  }

  _waitForSocketConnection(socket, callback) {
    setTimeout(() => {
      if (socket.readyState === 1) {
        callback();
        return;
      }

      this._waitForSocketConnection(socket, callback);
    }, 500);
  }
}
