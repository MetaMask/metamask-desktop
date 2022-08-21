const { Duplex } = require('stream');
const { ipcMain } = require('electron');
const log = require('../main-logger');
const { flattenMessage } = require('../utils');

module.exports = class RendererProcessStream extends Duplex {

    constructor(window, channel) {
        super({ objectMode: true });

        this._window = window;
        this._channel = channel;

        ipcMain.handle(channel, (event, data) => this._onMessage(data));
    }

    _onMessage (data) {
        log.debug('Received message from renderer process', flattenMessage(data));
        this.push(data);
    }

    _read() {
        return undefined;
    }

    _write(msg, encoding, cb) {
        log.debug('Sending message to renderer process', flattenMessage(msg));
        this._window.send(this._channel, msg);
        cb();
    }
};
