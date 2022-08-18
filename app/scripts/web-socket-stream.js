const { Duplex } = require("stream");

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
            this._logMessage('Received web socket message', 'Unknown', data);
        }

        this.push(data);
    }

    _read() {
        return undefined;
    }

    _write(msg, encoding, cb) {
        this._webSocket.send(JSON.stringify(msg));
        cb();
    }

    _logMessage (tag, client, data) {
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
                output = {client}
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