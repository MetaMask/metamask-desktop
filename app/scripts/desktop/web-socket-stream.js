import { Duplex } from 'stream';
import log from 'loglevel';
import { flattenMessage } from './utils';

export default class WebSocketStream extends Duplex {

    constructor(webSocket) {
        super({ objectMode: true });

        this._webSocket = webSocket;
        this._isBrowser = !this._webSocket.on;

        if(this._isBrowser) {
            this._webSocket.addEventListener('message', (event) => this._onMessage(event.data));
        } else {
            this._webSocket.on('message', (message) => this._onMessage(message));
        }
    }

    _onMessage (rawData) {
        const data = JSON.parse(rawData);

        if(this._logging) {
            log.debug('Received web socket message', flattenMessage(data));
        }

        this.push(data);
    }

    _read() {
        return undefined;
    }

    _write(msg, encoding, cb) {
        log.debug('Sending message to web socket', flattenMessage(msg));

        const rawData = JSON.stringify(msg);

        if(this._isBrowser) {
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
            } else {
                this._waitForSocketConnection(socket, callback);
            }
        }, 500);
    }
};
