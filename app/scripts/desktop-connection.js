const WebSocketStream = require('./web-socket-stream');
const DummyStream = require('./dummy-stream');

const WEB_SOCKET_URL = 'ws://localhost:7071';
const CLIENT_ID_INTERNAL = 'extensionInternal';
const CLIENT_ID_EXTERNAL = 'extensionExternal';
const CLIENT_ID_BROWSER_CONTROLLER = 'extensionBrowserController';
const BROWSER_ACTION_SHOW_POPUP = 'showPopup';

module.exports = class DesktopConnection {

    constructor(notificationManager) {
        this._notificationManager = notificationManager;

        this._socketInternal = this._createWebSocket(CLIENT_ID_INTERNAL);
        this._socketExternal = this._createWebSocket(CLIENT_ID_EXTERNAL);

        const socketBrowserController = this._createWebSocket(CLIENT_ID_BROWSER_CONTROLLER);
        this._socketBrowserStream = new WebSocketStream(socketBrowserController);

        this._socketBrowserStream.on('data', (data) => this._onBrowserControlMessage(data));

        console.log('Connected to desktop');
    }

    createStream(portStream, options) {
        const webSocket = options.isInternal ? this._socketInternal : this._socketExternal;
        const webSocketStream = new WebSocketStream(webSocket);

        portStream.pipe(webSocketStream).pipe(portStream);

        return new DummyStream();
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

    _createWebSocket(clientId) {
        return new WebSocket(`${WEB_SOCKET_URL}/?id=${clientId}`);
    }
};