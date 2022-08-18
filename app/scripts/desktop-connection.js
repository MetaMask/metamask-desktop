const WebSocketStream = require('./web-socket-stream');
const PortStream = require('extension-port-stream');
const endOfStream = require('end-of-stream');
const ObjectMultiplex = require('obj-multiplex');

const WEB_SOCKET_URL = 'ws://localhost:7071';
const CLIENT_ID_BROWSER_CONTROLLER = 'browserController';
const CLIENT_ID_CONNECTION_CONTROLLER = 'connectionController';
const CLIENT_ID_HANDSHAKES = 'handshakes';
const BROWSER_ACTION_SHOW_POPUP = 'showPopup';

module.exports = class DesktopConnection {

    constructor(notificationManager) {
        this._notificationManager = notificationManager;
        this._clientIdCounter = 0;
        this._multiplex = new ObjectMultiplex();

        const webSocket = this._createWebSocket();

        console.log('Created web socket connection');

        const webSocketStream = new WebSocketStream(webSocket);
        webSocketStream.pipe(this._multiplex).pipe(webSocketStream);

        const browserControllerStream = this._multiplex.createStream(CLIENT_ID_BROWSER_CONTROLLER);
        browserControllerStream.on('data', (data) => this._onBrowserControlMessage(data));

        this._connectionControllerStream = this._multiplex.createStream(CLIENT_ID_CONNECTION_CONTROLLER);
        this._handshakeStream = this._multiplex.createStream(CLIENT_ID_HANDSHAKES);

        console.log('Connected to desktop');
    }

    createStream(remotePort) {
        const portStream = new PortStream(remotePort);
        const clientId = this._getNextClientId();
        const clientStream = this._multiplex.createStream(clientId);

        portStream.pipe(clientStream).pipe(portStream);

        endOfStream(portStream, () => this._onPortStreamEnd(clientId, clientStream));

        this._sendHandshake(remotePort, clientId);
    }

    _onPortStreamEnd(clientId, clientStream) {
        console.log('Port stream closed', clientId);

        clientStream.end();
        this._connectionControllerStream.write({ clientId });
    }

    _sendHandshake(remotePort, clientId) {
        const handshake = {
            clientId,
            remotePort: {
                name: remotePort.name,
                sender: remotePort.sender
            }
        };

        console.log('Sending handshake', handshake);

        this._handshakeStream.write(handshake);
    }

    _onBrowserControlMessage(data) {
        switch(data) {
            case BROWSER_ACTION_SHOW_POPUP:
                this._notificationManager.showPopup();
                return;
            default:
                console.log('Unrecognised browser control message', data);
                return;
        }
    }

    _createWebSocket() {
        return new WebSocket(`${WEB_SOCKET_URL}`);
    }

    _getNextClientId() {
        return this._clientIdCounter++;
    }
};