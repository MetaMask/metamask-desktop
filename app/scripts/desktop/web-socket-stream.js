import { Duplex } from 'stream';
import log from 'loglevel';
import { flattenMessage } from './utils';
import { encrypt, decrypt } from './encryption';

export default class WebSocketStream extends Duplex {

    constructor(webSocket, options) {
        super({ objectMode: true });

        this._webSocket = webSocket;
        this._isBrowser = !this._webSocket.on;
        this._options = { encryptionSecret: undefined, ...options };

        if(this._isBrowser) {
            this._webSocket.addEventListener('message', (event) => this._onMessage(event.data));
        } else {
            this._webSocket.on('message', (message) => this._onMessage(message));
        }
    }

    async _onMessage (rawData) {
        let decryptedData = rawData;
        
        if(this._options.encryptionSecret) {
            log.debug('Received encrypted web socket message', rawData);
            decryptedData = await decrypt(rawData, this._options.encryptionSecret);
        }

        const data = JSON.parse(decryptedData);

        if(this._logging) {
            log.debug('Received web socket message', flattenMessage(data));
        }

        this.push(data);
    }

    _read() {
        return undefined;
    }

    async _write(msg, encoding, cb) {
        log.debug('Sending message to web socket', flattenMessage(msg));

        const rawData = JSON.stringify(msg);
        let encryptedData = rawData;

        if(this._options.encryptionSecret) {
            encryptedData = await encrypt(rawData, this._options.encryptionSecret);
            log.debug('Sending encrypted message to web socket', encryptedData);
        }

        if(this._isBrowser) {
            this._sendBrowser(encryptedData, cb);
            return;
        }

        this._webSocket.send(encryptedData);
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
