const { Duplex } = require("stream");

module.exports = class CompositeStream extends Duplex {

    constructor(streams, tag, router) {
        super({ objectMode: true });

        this._streams = streams;
        this._tag = tag;
        this._router = router;

        this._ids = {};
        
        if(this._router) {
            this._router._init(this._streams, this._tag);
        }

        this._streams.forEach((stream, index) => {
            stream.on('data', (data) => this._onData(data, index));
        });
    }

    _onData(data, index) {
        if(this._router && !this._router._onData(data, index)) return;

        this.push(data);
    }

    _read() {
        return undefined;
    }

    _write(msg, _encoding, cb) {
        let streams = this._streams;

        if(this._router) {
            streams = this._router._onWrite(msg);

            if(streams === undefined) return;
        }

        streams.forEach((stream, index) => {
            try {
                stream.write(msg);
            } catch {
                console.log('Failed to write to stream within composite', JSON.stringify({index, tag: this._tag}));
            }
        });

        return cb();
    }
};