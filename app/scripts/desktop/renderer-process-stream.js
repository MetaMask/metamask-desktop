const { Duplex } = require('stream');
const { ipcMain } = require('electron');
const log = require('./main-logger');
const { prettyPrintRequest } = require('./utils');

module.exports = class RendererProcessStream extends Duplex {

    constructor(window, channel) {
        super({ objectMode: true });

        this._window = window;
        this._channel = channel;

        ipcMain.handle(channel, (event, data) => this._onMessage(data));
    }

    _onMessage (data) {
        log.debug('Received message from renderer process', prettyPrintRequest(data));
        this.push(data);
    }

    _read() {
        return undefined;
    }

    _write(msg, encoding, cb) {
        log.debug('Sending message to renderer process', prettyPrintRequest(msg));
        this._window.send(this._channel, msg);
        cb();
    }
};
