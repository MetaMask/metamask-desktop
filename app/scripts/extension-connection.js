const WebSocketServer  = require('ws').Server;
const WebSocketServerStream = require('./web-socket-server-stream');
const WebSocketStream = require('./web-socket-stream');
const CompositeStream = require('./composite-stream');
const JsonRpcCompositeStreamRouter = require('./json-rpc-composite-stream-router');

const WEB_SOCKET_PORT = 7071;
const WEB_SOCKET_URL = `ws://localhost:${WEB_SOCKET_PORT}`
const CLIENT_EXTENSION_INTERNAL = 'extensionInternal';
const CLIENT_EXTENSION_EXTERNAL =  'extensionExternal';
const CLIENT_EXTENSION_BROWSER_CONTROLLER = 'extensionBrowserController';
const CLIENT_RENDER_PROCESS_INTERNAL = 'renderProcessInternal';
const CLIENT_RENDER_PROCESS_EXTERNAL = 'renderProcessExternal';
const CLIENT_RENDER_PROCESS_BROWSER_CONTROLLER = 'renderProcessBrowserController';
const BROWSER_ACTION_SHOW_POPUP = 'showPopup';

const createServer = async (onConnection = undefined) => {
    const webSocketServer = await _createWebSocketServer({ port: WEB_SOCKET_PORT });

    const extensionInternalStream = new WebSocketServerStream(
        webSocketServer, CLIENT_EXTENSION_INTERNAL, onConnection, true);

    const extensionExternalStream = new WebSocketServerStream(
        webSocketServer, CLIENT_EXTENSION_EXTERNAL, onConnection, true);

    const extensionBrowserControllerStream = new WebSocketServerStream(
        webSocketServer, CLIENT_EXTENSION_BROWSER_CONTROLLER, onConnection);

    const renderProcessInternalStream = new WebSocketServerStream(
        webSocketServer, CLIENT_RENDER_PROCESS_INTERNAL, onConnection);

    const renderProcessExternalStream = new WebSocketServerStream(
        webSocketServer, CLIENT_RENDER_PROCESS_EXTERNAL, onConnection);

    const renderProcessBrowserControllerStream = new WebSocketServerStream(
        webSocketServer, CLIENT_RENDER_PROCESS_BROWSER_CONTROLLER, onConnection);

    extensionInternalStream.pipe(renderProcessInternalStream).pipe(extensionInternalStream);
    extensionExternalStream.pipe(renderProcessExternalStream).pipe(extensionExternalStream);
    renderProcessBrowserControllerStream.pipe(extensionBrowserControllerStream);

    console.log('Created web socket server')

    return webSocketServer;
};

const _createWebSocketServer = async (options) => {
    return new Promise((resolve) => {
        const server = new WebSocketServer(options, () => {
            resolve(server);
        });
    });
};

class ExtensionConnection {
    constructor() {
        const browserControllerSocket = this._createWebSocket(CLIENT_RENDER_PROCESS_BROWSER_CONTROLLER);
        this._browserControllerStream = new WebSocketStream(browserControllerSocket);
        this._isExternalConnectionCreated = false;
    }

    createStream (portStream, options) {
        if(!options.isInternal && this._isExternalConnectionCreated) return portStream;
        
        const clientId = options.isInternal ? CLIENT_RENDER_PROCESS_INTERNAL : CLIENT_RENDER_PROCESS_EXTERNAL;
        const streamTag = options.isInternal ? 'Internal' : 'External';
        const webSocketStream = new WebSocketStream(this._createWebSocket(clientId));
    
        const compositeStream = new CompositeStream(
            [portStream, webSocketStream], streamTag,
                new JsonRpcCompositeStreamRouter({verbose: false}));
    
        if(!options.isInternal) {
            this._isExternalConnectionCreated = true;
        }
    
        return compositeStream;
    }

    showPopup() {
        this._browserControllerStream.write(BROWSER_ACTION_SHOW_POPUP);
    }

    _createWebSocket(clientId) {
        return new WebSocket(`${WEB_SOCKET_URL}/?id=${clientId}`);
    }
};

module.exports = {
    ExtensionConnection,
    createServer
};