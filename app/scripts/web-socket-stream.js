const { Duplex } = require("stream");

module.exports = class WebSocketStream extends Duplex {

    constructor(webSocket) {
        super({ objectMode: true });

        this._webSocket = webSocket;

        this._webSocket.addEventListener('message', (event) => this._onMessage(event));
    }

    _onMessage(event) {
        const data = JSON.parse(event.data);

        this._logMessage('Received message from web socket', data);
        
        this.push(data);
    }

    _read() {
        return undefined;
    }

    _write(msg, _encoding, cb) {
        const rawData = JSON.stringify(msg);

        try {
            this._waitForSocketConnection(this._webSocket, () => {
                this._logMessage('Sending message to web socket', rawData)
                this._webSocket.send(rawData);
                cb();
            })
        }
        catch (error) {
            console.log('Error during web socket write', JSON.stringify(error))
            cb();
        }
    }
    
    _waitForSocketConnection(socket, callback) {
        setTimeout(() => {
            if (socket.readyState === 1) {
                callback();
            } else {
                this._waitForSocketConnection(socket, callback);
            }
        }, 500);
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