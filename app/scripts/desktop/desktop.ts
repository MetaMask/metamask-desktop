import path from 'path';
import { Duplex } from 'stream';
import { app, BrowserWindow } from 'electron';
import { Server as WebSocketServer, WebSocket } from 'ws';
import endOfStream from 'end-of-stream';
import ObjectMultiplex from 'obj-multiplex';
import log from 'loglevel';
import {
  CLIENT_ID_BROWSER_CONTROLLER,
  CLIENT_ID_CONNECTION_CONTROLLER,
  CLIENT_ID_HANDSHAKES,
  CLIENT_ID_STATE,
  CLIENT_ID_DISABLE,
} from '../../../shared/constants/desktop';
import cfg from './config';
import { updateCheck } from './update-check';
import { WebSocketStream } from './web-socket-stream';
import EncryptedWebSocketStream from './encrypted-web-socket-stream';
import { browser } from './extension-polyfill';
import { ConnectRemoteFactory } from './types/background';
import {
  BrowserControllerAction,
  ConnectionControllerMessage,
  HandshakeMessage,
  StatusMessage,
} from './types/message';
import { ClientId } from './types/desktop';

export default class Desktop {
  private backgroundInitialise: () => Promise<void>;

  private connections: HandshakeMessage[];

  private multiplex: ObjectMultiplex;

  private clientStreams: { [clientId: ClientId]: Duplex };

  private connectRemote?: ConnectRemoteFactory;

  private connectExternal?: ConnectRemoteFactory;

  private webSocket?: WebSocket;

  private webSocketStream?: WebSocketStream | EncryptedWebSocketStream;

  private browserControllerStream?: Duplex;

  private disableStream?: Duplex;

  private statusWindow?: BrowserWindow;

  constructor(backgroundInitialise: () => Promise<void>) {
    this.backgroundInitialise = backgroundInitialise;
    this.connections = [];
    this.multiplex = new ObjectMultiplex();
    this.clientStreams = {};
  }

  async init() {
    await app.whenReady();

    this.statusWindow = await this._createStatusWindow();

    const server = await this._createWebSocketServer();
    server.on('connection', (webSocket) => this._onConnection(webSocket));

    this.browserControllerStream = this.multiplex.createStream(
      CLIENT_ID_BROWSER_CONTROLLER,
    );

    const connectionControllerStream = this.multiplex.createStream(
      CLIENT_ID_CONNECTION_CONTROLLER,
    );
    connectionControllerStream.on('data', (data: ConnectionControllerMessage) =>
      this._onConnectionControllerMessage(data),
    );

    const handshakeStream = this.multiplex.createStream(CLIENT_ID_HANDSHAKES);
    handshakeStream.on('data', (data: HandshakeMessage) =>
      this._onHandshake(data),
    );

    const stateStream = this.multiplex.createStream(CLIENT_ID_STATE);
    stateStream.on('data', (data: any) => this._onExtensionState(data));

    this.disableStream = this.multiplex.createStream(CLIENT_ID_DISABLE);

    log.debug('Initialised desktop');

    updateCheck();
  }

  async disable() {
    log.debug('Disabling desktop usage');

    if (!this.disableStream) {
      log.error('Disable stream not initialised');
      return;
    }

    const state = await browser.storage.local.get();
    state.data.PreferencesController.desktopEnabled = false;

    this.disableStream.write(state);
  }

  setConnectCallbacks(
    connectRemote: ConnectRemoteFactory,
    connectExternal: ConnectRemoteFactory,
  ) {
    this.connectRemote = connectRemote;
    this.connectExternal = connectExternal;
  }

  showPopup() {
    if (!this.browserControllerStream) {
      log.debug('Browser controller stream not initialised');
      return;
    }

    this.browserControllerStream.write(
      BrowserControllerAction.BROWSER_ACTION_SHOW_POPUP,
    );
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

  _onConnection(webSocket: WebSocket) {
    log.debug('Received web socket connection');

    this.webSocket = webSocket;
    this.webSocket.on('close', () => this._onDisconnect());

    this.webSocketStream = cfg().desktop.webSocket.disableEncryption
      ? new WebSocketStream(this.webSocket)
      : new EncryptedWebSocketStream(this.webSocket);

    this.webSocketStream.init();
    this.webSocketStream.pipe(this.multiplex).pipe(this.webSocketStream);

    this._updateStatusWindow();
  }

  _onDisconnect() {
    log.debug('Web socket disconnected');

    this.webSocket = undefined;

    if (this.webSocketStream) {
      this.webSocketStream.end();
    } else {
      log.error('Web socket stream not initialised');
    }

    Object.values(this.clientStreams).forEach((clientStream) =>
      clientStream.end(),
    );

    this._updateStatusWindow();
  }

  _onHandshake(data: HandshakeMessage) {
    log.debug('Received handshake', {
      clientId: data.clientId,
      name: data.remotePort.name,
      url: data.remotePort.sender.url,
      isExternal: data.isExternal,
    });

    if (!this.connectRemote) {
      log.error('Connect remote factory not provided');
      return;
    }

    const { clientId, isExternal } = data;

    const stream = this.multiplex.createStream(clientId);
    this.clientStreams[clientId] = stream;

    endOfStream(stream, () => this._onClientStreamEnd(clientId));

    const connectArgs = {
      ...data.remotePort,
      stream,
      onMessage: {
        addListener: () => undefined,
      },
    };

    if (isExternal) {
      this.connectExternal!(connectArgs);
    } else {
      this.connectRemote!(connectArgs);
    }

    this.connections.push(data);
    this._updateStatusWindow();
  }

  async _onExtensionState(data: any) {
    log.debug('Received extension state');

    await browser.storage.local.set(data);
    log.debug('Synchronised state with extension');

    log.debug('Re-initialising background script');
    await this.backgroundInitialise();
  }

  _onClientStreamEnd(clientId: ClientId) {
    log.debug('Client stream ended', clientId);

    const index = this.connections.findIndex(
      (connection) => connection.clientId === clientId,
    );

    this.connections.splice(index, 1);

    delete this.clientStreams[clientId];
    delete this.multiplex._substreams[clientId];

    this._updateStatusWindow();
  }

  _onConnectionControllerMessage(data: ConnectionControllerMessage) {
    log.debug('Received connection controller message', data);
    this.clientStreams[data.clientId as number].end();
  }

  async _createWebSocketServer(): Promise<WebSocketServer> {
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
    if (!this.statusWindow) {
      log.error('Status window not created');
      return;
    }

    const statusMessage: StatusMessage = {
      isWebSocketConnected: Boolean(this.webSocket),
      connections: this.connections,
    };

    this.statusWindow.webContents.send('status', statusMessage);
  }
}
