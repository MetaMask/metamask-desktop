import path from 'path';
import { app, BrowserWindow } from 'electron';
import { Server as WebSocketServer } from 'ws';
import endOfStream from 'end-of-stream';
import ObjectMultiplex from 'obj-multiplex';
import log from 'loglevel';
import {
  CLIENT_ID_BROWSER_CONTROLLER,
  CLIENT_ID_CONNECTION_CONTROLLER,
  CLIENT_ID_HANDSHAKES,
  BROWSER_ACTION_SHOW_POPUP,
  CLIENT_ID_STATE,
  CLIENT_ID_DISABLE,
} from '../../../shared/constants/desktop';
import cfg from './config';
import { updateCheck } from './update-check';
import WebSocketStream from './web-socket-stream';
import EncryptedWebSocketStream from './encrypted-web-socket-stream';
import { browser } from './extension-polyfill';

export default class Desktop {
  constructor(backgroundInitialise) {
    this._backgroundInitialise = backgroundInitialise;
    this._connections = [];
    this._multiplex = new ObjectMultiplex();
    this._clientStreams = {};
  }

  async init() {
    await app.whenReady();

    this._statusWindow = await this._createStatusWindow();

    const server = await this._createWebSocketServer();
    server.on('connection', (webSocket) => this._onConnection(webSocket));

    this._browserControllerStream = this._multiplex.createStream(
      CLIENT_ID_BROWSER_CONTROLLER,
    );

    const connectionControllerStream = this._multiplex.createStream(
      CLIENT_ID_CONNECTION_CONTROLLER,
    );
    connectionControllerStream.on('data', (data) =>
      this._onConnectionControllerMessage(data),
    );

    const handshakeStream = this._multiplex.createStream(CLIENT_ID_HANDSHAKES);
    handshakeStream.on('data', (data) => this._onHandshake(data));

    const stateStream = this._multiplex.createStream(CLIENT_ID_STATE);
    stateStream.on('data', (data) => this._onExtensionState(data));

    this._disableStream = this._multiplex.createStream(CLIENT_ID_DISABLE);

    log.debug('Initialised desktop');

    updateCheck();
  }

  async disable() {
    log.debug('Disabling desktop usage');

    const state = await browser.storage.local.get();
    state.data.PreferencesController.desktopEnabled = false;

    this._disableStream.write(state);
  }

  setConnectRemote(connectRemote) {
    this._connectRemote = connectRemote;
  }

  showPopup() {
    this._browserControllerStream.write(BROWSER_ACTION_SHOW_POPUP);
  }

  async _createStatusWindow() {
    const statusWindow = new BrowserWindow({
      width: 800,
      height: 400,
      webPreferences: {
        preload: path.resolve(__dirname, './status-preload.js'),
      },
      // Doesn not work because it's not currently being added to dist_desktop
      // icon: path.resolve(__dirname, '../../build-types/desktop/images/icon-512.png')
    });

    await statusWindow.loadFile(path.resolve(__dirname, '../../desktop.html'));

    log.debug('Created status window');

    return statusWindow;
  }

  _onConnection(webSocket) {
    log.debug('Received web socket connection');

    this._webSocket = webSocket;
    this._webSocket.on('close', () => this._onDisconnect());

    this._webSocketStream = cfg().desktop.webSocket.disableEncryption
      ? new WebSocketStream(this._webSocket)
      : new EncryptedWebSocketStream(this._webSocket);

    this._webSocketStream.init();
    this._webSocketStream.pipe(this._multiplex).pipe(this._webSocketStream);

    this._updateStatusWindow();
  }

  _onDisconnect() {
    this._webSocket = undefined;
    this._webSocketStream.end();

    Object.values(this._clientStreams).forEach((clientStream) =>
      clientStream.end(),
    );

    this._updateStatusWindow();
  }

  _onHandshake(data) {
    log.debug('Received handshake', {
      clientId: data.clientId,
      name: data.remotePort.name,
      url: data.remotePort.sender.url,
      isExternal: data.isExternal,
    });

    const { clientId } = data;

    const stream = this._multiplex.createStream(clientId);
    this._clientStreams[clientId] = stream;

    endOfStream(stream, () => this._onClientStreamEnd(clientId));

    if (data.isExternal) {
      this._connectExternal({
        ...data.remotePort,
        stream,
        onMessage: {
          addListener: () => undefined,
        },
      });
    } else {
      this._connectRemote({
        ...data.remotePort,
        stream,
        onMessage: {
          addListener: () => undefined,
        },
      });
    }

    this._connections.push(data);
    this._updateStatusWindow();
  }

  async _onExtensionState(data) {
    log.debug('Received extension state');

    await browser.storage.local.set(data);
    log.debug('Synchronised state with extension');

    log.debug('Re-initialising background script');
    await this._backgroundInitialise();
  }

  _onClientStreamEnd(clientId) {
    log.debug('Client stream ended', clientId);

    const index = this._connections.find(
      (connection) => connection.clientId === clientId,
    );

    this._connections.splice(index, 1);

    delete this._clientStreams[clientId];
    delete this._multiplex._substreams[clientId];

    this._updateStatusWindow();
  }

  _onConnectionControllerMessage(data) {
    log.debug('Received connection controller message', data);
    this._clientStreams[data.clientId].end();
  }

  async _createWebSocketServer() {
    return new Promise((resolve) => {
      const server = new WebSocketServer(
        { port: cfg().desktop.webSocket.port },
        () => {
          log.debug('Created web socket server');
          resolve(server);
        },
      );
    });
  }

  _updateStatusWindow() {
    this._statusWindow.webContents.send('status', {
      isWebSocketConnected: Boolean(this._webSocket),
      connections: this._connections,
    });
  }
}
