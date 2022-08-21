const { Duplex } = require("stream");
const log = require('loglevel');
const { flattenMessage } = require("./utils");

module.exports = class WebSocketStream extends Duplex {

    constructor(webSocket, logging = false) {
        super({ objectMode: true });

        this._webSocket = webSocket;
        this._logging = logging;

        this._webSocket.on('message', (message) => this._onMessage(message));
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
        this._webSocket.send(JSON.stringify(msg));
        cb();
    }
};
