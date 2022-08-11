const { Duplex } = require("stream");

module.exports = class CompositeStream extends Duplex {

    constructor(streams) {
        super({ objectMode: true });

        this._streams = streams;

        this._streams.forEach(stream => {
            stream.on('data', (data) => this._onData(data));
        });
    }

    _onData(data) {
        this.push(data);
    }

    _read() {
        return undefined;
    }

    _write(msg, _encoding, cb) {
        this._streams.forEach(stream => {
            try {
                stream.write(msg);
            } catch {
                console.log('Failed to write to stream within composite')
            }
        });

        return cb();
    }
};