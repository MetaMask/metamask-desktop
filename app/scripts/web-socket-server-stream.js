const { Duplex } = require("stream");

module.exports = class WebSocketServerStream extends Duplex {

    constructor(webSocketServer, clientId, callback = () => {}, logging = false) {
        super({ objectMode: true });

        this._server = webSocketServer;
        this._clientId = clientId;
        this._client = undefined;
        this._callback = callback;
        this._logging = logging;

        this._server.on('connection', (ws, req) => this._onConnection(ws, req))
    }

    _onConnection (ws, req) {
        const clientId = req.url.split('/?id=')[1]

        if(clientId !== this._clientId) return;

        console.log('Web socket connection', {clientId});
    
        if(this._client) {
            console.log('Closing existing web socket connection', {clientId})
            this._client.close()
        }

        this._client = ws;

        ws.on('message', (message) => this._onMessage(message))

        this._callback();
    }

    _onMessage (message) {
        if(this._logging) {
            this._logMessage('Received web socket message', this._clientId, message)
        }

        this.push(JSON.parse(message));
    }

    _read() {
        return undefined;
    }

    _write(msg, encoding, cb) {
        if(this._client) {
            this._client.send(JSON.stringify(msg));
        }

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