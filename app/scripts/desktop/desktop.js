import path from 'path';
import { app, BrowserWindow, ipcMain } from 'electron';
import { Server as WebSocketServer } from 'ws';
import ExtensionStream from './extension-stream';
import endOfStream from 'end-of-stream';
import ObjectMultiplex from 'obj-multiplex';
import log from 'loglevel';
import cfg from './config';
import updateCheck from './update-check';
import {
  CLIENT_ID_BROWSER_CONTROLLER,
  CLIENT_ID_CONNECTION_CONTROLLER,
  CLIENT_ID_HANDSHAKES,
  BROWSER_ACTION_SHOW_POPUP
} from '../../../shared/constants/desktop';

export default class Desktop {
  constructor(mockState) {
    this._connections = [];
    this._multiplex = new ObjectMultiplex();
    this._clientStreams = {};
    this._mockState = mockState;
  }

  async init(connectRemote) {
    this._connectRemote = connectRemote;
  
    await app.whenReady();

    this._statusWindow = await this._createStatusWindow();

    this._browserControllerStream = this._multiplex.createStream(CLIENT_ID_BROWSER_CONTROLLER);

    const connectionControllerStream = this._multiplex.createStream(CLIENT_ID_CONNECTION_CONTROLLER);
    connectionControllerStream.on('data', (data) => this._onConnectionControllerMessage(data));

    const handshakeStream = this._multiplex.createStream(CLIENT_ID_HANDSHAKES);
    handshakeStream.on('data', (data) => this._onHandshake(data));

    ipcMain.handle('password', (event, data) => this._onPasswordSave(data));

    this._updateStatusWindow();

    log.debug('Initialised desktop');

    updateCheck()
  }

  showPopup() {
    this._browserControllerStream.write(BROWSER_ACTION_SHOW_POPUP);
  }

  async _createStatusWindow() {
    const statusWindow = new BrowserWindow({
      width: 800,
      height: 700,
      webPreferences: {
        preload: path.resolve(__dirname, './status-preload.js')
      },
      // Doesn not work because it's not currently being added to dist_desktop
      //icon: path.resolve(__dirname, '../../build-types/desktop/images/icon-512.png')
    });
  
    await statusWindow.loadFile(path.resolve(__dirname, '../../desktop.html'));
  
    log.debug('Created status window');
  
    return statusWindow;
  }

  _onConnection(webSocket) {
    log.debug('Received web socket connection');

    this._webSocket = webSocket;
    this._webSocket.on('close', () => this._onDisconnect());

    this._webSocketStream = new ExtensionStream(
      webSocket, this._encryptionSecret, this._mockState, () => this._updateStatusWindow());
  
    this._webSocketStream
      .pipe(this._multiplex)
      .pipe(this._webSocketStream);

    this._updateStatusWindow();
  }

  _onDisconnect() {
    this._webSocket = undefined;
    this._webSocketStream.end();
    this._webSocketStream = undefined;

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
      isServerReady: !!this._server,
      isExtensionConnected: !!this._webSocket,
      isEncrypted: !!this._webSocketStream?.isEncrypted(),
      connections: this._connections
    });
  }

  async _onPasswordSave(password) {
    console.log('Received password', password);
    this._encryptionSecret = password;

    this._server = await this._createWebSocketServer();
    this._server.on('connection', (webSocket) => this._onConnection(webSocket));
    
    this._updateStatusWindow();
  }
};
