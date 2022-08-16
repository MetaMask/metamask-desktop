const path = require('path');
const { app, BrowserWindow } = require('electron');
const { ENVIRONMENT_TYPE_FULLSCREEN } = require('../../shared/constants/app');
const WebSocketServer  = require('ws').Server;
const WebSocket = require('ws');
const WebSocketServerStream = require('./web-socket-server-stream');
const CompositeStream = require('./composite-stream');
const JsonRpcCompositeStreamRouter = require('./json-rpc-composite-stream-router');

const WEB_SOCKET_PORT = 7071;
const WEB_SOCKET_URL = `ws://localhost:${WEB_SOCKET_PORT}`
const CLIENT_EXTENSION_INTERNAL = 'extensionInternal';
const CLIENT_EXTENSION_EXTERNAL =  'extensionExternal';
const CLIENT_EXTENSION_BROWSER_CONTROLLER = 'extensionBrowserController';
const BROWSER_ACTION_SHOW_POPUP = 'showPopup';

class Desktop {
  constructor() {
    this._isExternalConnectionCreated = false;
  }

  async init(connectRemote, connectExternal) {
    await app.whenReady();

    const statusWindow = await this._createStatusWindow();

    const onSocketConnection = (clientId, isConnected) => {
      statusWindow.webContents.send('socket-connection', {clientId, isConnected});
    };
  
    await this._createServer(onSocketConnection);

    connectRemote({name: ENVIRONMENT_TYPE_FULLSCREEN, sender: {url: 'http://test.com', tab: {id: '12345'}}});
    console.log('Created internal connection');

    connectExternal({name: ENVIRONMENT_TYPE_FULLSCREEN, sender: {url: 'http://test2.com', tab: {id: '12346'}}});
    console.log('Created external connection');

    console.log('Initialised desktop');
  }

  createStream (options) {
    if(!options.isInternal && this._isExternalConnectionCreated) return undefined;
    
    const streamTag = options.isInternal ? 'Internal' : 'External';
    const webSocketStream = options.isInternal ? this._extensionInternalStream : this._extensionExternalStream;

    const compositeStream = new CompositeStream(
        [webSocketStream], streamTag,
            new JsonRpcCompositeStreamRouter({
              verbose: process.env.VERBOSE === 'true'
            }));

    if(!options.isInternal) {
        this._isExternalConnectionCreated = true;
    }

    return compositeStream;
  }

  showPopup() {
    this._extensionBrowserControllerStream.write(BROWSER_ACTION_SHOW_POPUP);
  }

  addGlobals() {
    global.crypto = {
      getRandomValues: require('polyfill-crypto.getrandomvalues'),
      subtle: require('node:crypto').webcrypto.subtle
    };

    global.window = {
      navigator: {
        userAgent: 'Firefox'
      }
    };
  
    console.log('Added missing globals');
  }

  async _createServer(onConnection = undefined) {
    const webSocketServer = await this._createWebSocketServer({ port: WEB_SOCKET_PORT });

    this._extensionInternalStream = new WebSocketServerStream(
        webSocketServer, CLIENT_EXTENSION_INTERNAL, onConnection, true);

    this._extensionExternalStream = new WebSocketServerStream(
        webSocketServer, CLIENT_EXTENSION_EXTERNAL, onConnection, true);

    this._extensionBrowserControllerStream = new WebSocketServerStream(
        webSocketServer, CLIENT_EXTENSION_BROWSER_CONTROLLER, onConnection, true);

    console.log('Created web socket server')

    return webSocketServer;
  }

  async _createStatusWindow() {
    const statusWindow = new BrowserWindow({
      width: 320,
      height: 215,
      webPreferences: {
        preload: path.resolve(__dirname, './preload.js')
      }
    });
  
    await statusWindow.loadFile('../desktop.html');
  
    console.log('Created status window');
  
    return statusWindow;
  }

  async _createWebSocketServer (options) {
    return new Promise((resolve) => {
        const server = new WebSocketServer(options, () => {
            resolve(server);
        });
    });
  }

  _createWebSocket(clientId) {
      return new WebSocket(`${WEB_SOCKET_URL}/?id=${clientId}`);
  }
}

module.exports = Desktop;
