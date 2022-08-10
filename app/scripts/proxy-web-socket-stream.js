const { Duplex } = require("stream");

module.exports = class ProxyWebSocketStream extends Duplex {

    constructor(webSocket, portStream) {
        super({ objectMode: true });

        this._webSocket = webSocket;
        this._portStream = portStream;

        this._webSocket.addEventListener('message', (event) => this._onSocketMessage(event))
        this._portStream.on('data', (data) => this._onPortData(data));
    }

    _onSocketMessage(event) {
        this._logMessage('Retrieved response from desktop', event.data)
        this._portStream.write(JSON.parse(event.data))
    }

    _onPortData(data) {
        this._logMessage('Sending request to desktop', JSON.stringify(data))
        this._webSocket.send(JSON.stringify(data))
    }
   
    _read() {
        return undefined;
    }

    _write(msg, _encoding, cb) {
        return cb();
    }

    _logMessage(tag, data) {
        let output
      
        try {
            const parsed = JSON.parse(data)
            const name = parsed.name
            const id = name ? parsed.data.id : parsed.id
            const method = name ? parsed.data.method : parsed.method
            const result = name ? parsed.data.result : parsed.result

            if(!method && !id) {
                output = parsed
            } else {
                output = {}
                output = {...output, ...(name ? {name} : {})}
                output = {...output, ...(id ? {id} : {})}
                output = {...output, ...(method ? {method} : {})}
                output = {...output, ...(result ? {result: true} : {})}
            }
        } catch {
            output = data
        }
      
        console.log(tag, output)
    }
};