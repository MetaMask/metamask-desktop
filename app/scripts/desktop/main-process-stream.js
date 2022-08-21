const { Duplex } = require('stream');
const log = require('./renderer-logger');
const { prettyPrintRequest } = require('./utils');

module.exports = class MainProcessStream extends Duplex {

    constructor(channel) {
        super({ objectMode: true });

        this._channel = channel;

        window.electron.mainProcess.onMessage(channel, (data) => this._onMessage(data));
    }

    _onMessage (data) {
        log.debug('Received message from main process', prettyPrintRequest(data));
        this.push(data);
    }

    _read() {
        return undefined;
    }

    _write(msg, encoding, cb) {
        log.debug('Sending message to main process', prettyPrintRequest(msg));
        window.electron.mainProcess.send(this._channel, msg);
        cb();
    }
};
