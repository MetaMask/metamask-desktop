const path = require('path');
const { app, BrowserWindow, session, webContents } = require('electron');
const WebSocketServer  = require('ws').Server;
const WebSocketStream = require('./streams/web-socket-stream');
const ObjectMultiplex = require('obj-multiplex');
const log = require('./main-logger');
const RendererProcessStream = require('./streams/renderer-process-stream');
const MultiplexFilterStream = require('./streams/multiplex-filter-stream');

const WEB_SOCKET_PORT = 7071;
const CLIENT_ID_CONNECTION_CONTROLLER = 'connectionController';
const CLIENT_ID_STATUS = 'status';

class Desktop {
  constructor() {
    this._multiplex = new ObjectMultiplex();
  }

  async init () {
    await app.whenReady();

    this._statusWindow = await this._createStatusWindow();

    const server = await this._createWebSocketServer({ port: WEB_SOCKET_PORT });
    server.on('connection', (webSocket) => this._onConnection(webSocket));

    this._connectionControllerStream = this._multiplex.createStream(CLIENT_ID_CONNECTION_CONTROLLER);

    const statusStream = this._multiplex.createStream(CLIENT_ID_STATUS);
    statusStream.on('data', (data) => this._onStatusMessage(data));

    const backgroundWindow = await this._startExtension();

    this._rendererStream = new RendererProcessStream(backgroundWindow, 'desktop');

    this._rendererStream
      .pipe(new MultiplexFilterStream([CLIENT_ID_STATUS]))
      .pipe(this._multiplex)
      .pipe(this._rendererStream);

    log.verbose('Initialised desktop in main process');
  }

  async _startExtension() {
    const preloadPath = path.join(__dirname, './extension-preload.js');
    session.defaultSession.setPreloads(session.defaultSession.getPreloads().concat(preloadPath));
    
    const extensionPath = path.resolve(__dirname, '../../../dist/chrome/');

    // Hide MV2 warning
    await this._hideErrors(async () => {
      await session.defaultSession.loadExtension(extensionPath);
    });

    const backgroundWindow = webContents.getAllWebContents()
      .find(window => window.getType() === "backgroundPage");

    log.verbose('Started extension');

    return backgroundWindow;
  }

  async _createStatusWindow() {
    const statusWindow = new BrowserWindow({
      width: 800,
      height: 400,
      webPreferences: {
        preload: path.resolve(__dirname, './status-preload.js')
      }
    });
  
    await statusWindow.loadFile('../../desktop.html');
  
    log.verbose('Created status window');
  
    return statusWindow;
  }

  _onConnection(webSocket) {
    log.verbose('Web socket connection');

    webSocket.on('close', () => this._onDisconnect());

    this._extensionStream = new WebSocketStream(webSocket);

    this._extensionStream
      .pipe(this._rendererStream)
      .pipe(this._extensionStream);

    this._updateStatusWindow();
  }

  _onStatusMessage(data) {
    log.verbose('Received status message', data);
    this._connections = data.connections;
    this._updateStatusWindow();
  }

  _onDisconnect() {
    log.verbose('Extension disconnected');
  
    this._extensionStream.end();
    this._extensionStream = undefined;

    this._connectionControllerStream.write({});

    this._updateStatusWindow();
  }

  async _createWebSocketServer (options) {
    return new Promise((resolve) => {
        const server = new WebSocketServer(options, () => {
          log.verbose('Created web socket server');
            resolve(server);
        });
    });
  }

  _updateStatusWindow() {
    this._statusWindow.webContents.send('status', {
      isWebSocketConnected: !!this._extensionStream,
      connections: this._connections
    });
  }

  async _hideErrors(callback) {
    const originalError = console.error;
    console.error = () => {};
    await callback();
    console.error = originalError;
  }
}

new Desktop().init();
