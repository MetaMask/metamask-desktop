const { Duplex } = require("stream");

module.exports = class WebSocketStream extends Duplex {

    constructor(webSocket) {
        super({ objectMode: true });

        this._webSocket = webSocket;
        this._webSocket.addEventListener('message', (event) => this._onMessage(event))
    }

    _onMessage(event) {
        this.push(JSON.parse(event.data))
    }

    _read() {
        return undefined;
    }

    _write(msg, _encoding, cb) {
        try {
            this._waitForSocketConnection(this._webSocket, () => {
                this._webSocket.send(JSON.stringify(msg))
            })
        }
        catch (error) {
            console.log('Error during web socket write', JSON.stringify(error))
        }

        return cb();
    }
    
    _waitForSocketConnection(socket, callback) {
        setTimeout(() => {
            if (socket.readyState === 1) {
                callback();
            } else {
                waitForSocketConnection(socket, callback);
            }
        }, 500);
    }
};