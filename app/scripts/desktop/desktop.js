const path = require('path');
const { app, BrowserWindow } = require('electron');
const WebSocketServer  = require('ws').Server;
const WebSocketStream = require('./web-socket-stream');
const endOfStream = require('end-of-stream');
const ObjectMultiplex = require('obj-multiplex');
const log = require('loglevel');

const WEB_SOCKET_PORT = 7071;
const CLIENT_ID_BROWSER_CONTROLLER = 'browserController';
const CLIENT_ID_CONNECTION_CONTROLLER = 'connectionController';
const CLIENT_ID_HANDSHAKES = 'handshakes';
const BROWSER_ACTION_SHOW_POPUP = 'showPopup';

class Desktop {
  constructor() {
    this._connections = [];
    this._multiplex = new ObjectMultiplex();
    this._clientStreams = {};
  }

  async init(connectRemote) {
    this._connectRemote = connectRemote;
  
    await app.whenReady();

    this._statusWindow = await this._createStatusWindow();

    const server = await this._createWebSocketServer({ port: WEB_SOCKET_PORT });
    server.on('connection', (webSocket) => this._onConnection(webSocket));

    this._browserControllerStream = this._multiplex.createStream(CLIENT_ID_BROWSER_CONTROLLER);

    const connectionControllerStream = this._multiplex.createStream(CLIENT_ID_CONNECTION_CONTROLLER);
    connectionControllerStream.on('data', (data) => this._onConnectionControllerMessage(data));

    const handshakeStream = this._multiplex.createStream(CLIENT_ID_HANDSHAKES);
    handshakeStream.on('data', (data) => this._onHandshake(data));

    log.debug('Initialised desktop');
  }

  showPopup() {
    this._browserControllerStream.write(BROWSER_ACTION_SHOW_POPUP);
  }

  addGlobals() {
    global.crypto = {
      ...global.crypto,
      getRandomValues: require('polyfill-crypto.getrandomvalues'),
      subtle: require('node:crypto').webcrypto.subtle
    };

    global.window = {
      ...global.window,
      navigator: {
        userAgent: 'Firefox'
      },
      postMessage: () => {}
    };
  
    log.debug('Added missing globals');
  }

  async _createStatusWindow() {
    const statusWindow = new BrowserWindow({
      width: 800,
      height: 400,
      webPreferences: {
        preload: path.resolve(__dirname, './status-preload.js')
      }
    });
  
    await statusWindow.loadFile('../desktop.html');
  
    log.debug('Created status window');
  
    return statusWindow;
  }

  _onConnection(webSocket) {
    log.debug('Received web socket connection');

    this._webSocket = webSocket;
    this._webSocket.on('close', () => this._onDisconnect());

    this._webSocketStream = new WebSocketStream(webSocket, true);
  
    this._webSocketStream
      .pipe(this._multiplex)
      .pipe(this._webSocketStream);

    this._updateStatusWindow();
  }

  _onDisconnect() {
    this._webSocket = undefined;
    this._webSocketStream.end();

    Object.values(this._clientStreams).forEach(clientStream => clientStream.end());

    this._updateStatusWindow();
  }

  _onHandshake(data) {
    log.debug('Received handshake', { 
      clientId: data.clientId,
      name: data.remotePort.name,
      url: data.remotePort.sender.url
    });

    const clientId = data.clientId;

    const stream = this._multiplex.createStream(clientId);
    this._clientStreams[clientId] = stream;

    endOfStream(stream, () => this._onClientStreamEnd(clientId));

    this._connectRemote({
      ...data.remotePort,
      stream,
      onMessage: {
        addListener: () => {}
      }
    });

    this._connections.push(data);
    this._updateStatusWindow();
  }

  _onClientStreamEnd(clientId) {
    log.debug('Client stream ended', clientId);

    const index = this._connections.find(connection => connection.clientId === clientId);
    this._connections.splice(index, 1);

    delete this._clientStreams[clientId];
    delete this._multiplex._substreams[clientId];
    
    this._updateStatusWindow();
  }

  _onConnectionControllerMessage(data) {
    log.debug('Received connection controller message', data);
    this._clientStreams[data.clientId].end();    
  }

  async _createWebSocketServer (options) {
    return new Promise((resolve) => {
        const server = new WebSocketServer(options, () => {
            log.debug('Created web socket server');
            resolve(server);
        });
    });
  }

  _updateStatusWindow() {
    this._statusWindow.webContents.send('status', {
      isWebSocketConnected: !!this._webSocket,
      connections: this._connections
    });
  }
}

module.exports = Desktop;
