const { Transform } = require('stream');

module.exports = class MultiplexFilter extends Transform {

    constructor(names) {
        super({ objectMode: true });

        this._names = names;
    }

    _transform(chunk, encoding, callback) {
        if(this._names.includes(chunk.name)) {
            callback(null, chunk);
        } else {
            callback(null, Buffer.alloc(0));
        }
    }
};
