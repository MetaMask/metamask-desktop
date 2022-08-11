const { Duplex } = require("stream");

module.exports = class DummyStream extends Duplex {

    constructor() {
        super({ objectMode: true });
    }

    _read () {
        return undefined;
    }

    _write (data, encoding, cb) {
        cb();
    }
};