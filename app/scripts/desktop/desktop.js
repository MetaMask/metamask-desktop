import path from 'path';
import { app, BrowserWindow } from 'electron';
import { Server as WebSocketServer } from 'ws';
import WebSocketStream from './web-socket-stream';
import endOfStream from 'end-of-stream';
import ObjectMultiplex from 'obj-multiplex';
import log from 'loglevel';
import {
  CLIENT_ID_BROWSER_CONTROLLER,
  CLIENT_ID_CONNECTION_CONTROLLER,
  CLIENT_ID_HANDSHAKES,
  BROWSER_ACTION_SHOW_POPUP
} from '../../../shared/constants/desktop';
import cfg from './config';

export default class Desktop {
  constructor() {
    this._connections = [];
    this._multiplex = new ObjectMultiplex();
    this._clientStreams = {};
  }

  async init(connectRemote) {
    this._connectRemote = connectRemote;
  
    await app.whenReady();

    this._statusWindow = await this._createStatusWindow();

    const server = await this._createWebSocketServer();
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
      // Ternary prevents LavaMoat failing as the library can't be found
      subtle: require(cfg().desktop.isApp ? 'node:crypto' : '').webcrypto.subtle
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

  async _createWebSocketServer () {
    return new Promise((resolve) => {
        const server = new WebSocketServer({ port: cfg().desktop.webSocket.port }, () => {
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
};
