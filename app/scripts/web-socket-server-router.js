module.exports = class WebSocketServerRouter {

    constructor(webSocketServer) {
        this._server = webSocketServer;
        this._clients = {}
        this._routes = {}
        this._logging = {}
        this._callbacks = {}

        this._server.on('connection', (ws, req) => this._onConnection(ws, req))
    }
    
    withRoute (source, destination, logging = false) {
        this._routes[source] = destination
        this._logging[source] = logging
        return this
    }

    onClientConnect(id, callback) {
        this._callbacks[id] = callback

        if(!!this._clients[id]) {
            callback()
        }

        return this
    }

    _onConnection (ws, req) {
        const id = req.url.split('/?id=')[1]

        console.log('Web socket connection', {id})

        const existingClient = this._clients[id]
    
        if(existingClient) {
            console.log('Closing existing web socket connection', {id})
            existingClient.close()
        }

        this._clients[id] = ws

        ws.on('message', (message) => this._onMessage(id, message))

        const callback = this._callbacks[id]

        if(callback) {
            callback()
        }
    }

    _onMessage (id, message) {
        const loggingEnabled = this._logging[id] === true

        if(loggingEnabled) {
            this._logMessage('Received web socket message', id, message)
        }

        const destination = this._routes[id]

        if(!destination) return

        const client = this._clients[destination]

        if(!client) return

        client.send(message)
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