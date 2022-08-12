module.exports = class JsonRpcCompositeStreamRouter {

    constructor(options = {}) {
        this._options = {verbose: false, ...options};

        this._requestIds = {};
        this._readCounters = {};
        this._writeCounters = {};
    }

    _init(streams, tag) {
        this._streams = streams;
        this._tag = tag;

        this._streams.forEach((stream, index) => {
            this._readCounters[index] = 0;
            this._writeCounters[index] = 0;
        });
    }

    _onData(data, streamIndex) {
        const requestId = data.data?.id;

        if(!requestId) {
            this._log('Cannot find id on JSON-RPC request', data);
            return false;
        }

        this._requestIds[requestId] = streamIndex;

        if(this._options.verbose) {
            this._log('Received request with ID', {streamIndex, requestId});

            this._readCounters[streamIndex] += 1;

            this._log('Read counters', this._readCounters);
        }

        return true;
    }

    _onWrite(data) {
        const requestId = data.data?.id;

        if(!requestId) return this._streams;

        if(this._options.verbose) {
            this._log('Received response with ID', {requestId});
        }

        const streamIndex = this._requestIds[requestId];

        if(streamIndex === undefined) {
            this._log('Request ID not recognised', {requestId});
            return undefined;
        }

        if(this._options.verbose) {
            this._writeCounters[streamIndex] += 1;

            this._log('Write counters', this._writeCounters);
        }

        return [this._streams[streamIndex]];
    }

    _log(tag, data) {
        console.log(`JSON-RPC Composite Stream Router - ${this._tag} - ${tag}`, JSON.stringify(data));
    }
};