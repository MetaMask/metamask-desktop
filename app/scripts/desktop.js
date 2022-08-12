const path = require('path')
const { app, session, BrowserWindow } = require('electron')
const WebSocketServer  = require('ws').Server
const {
  CLIENT_EXTENSION_INTERNAL,
  CLIENT_EXTENSION_EXTERNAL,
  CLIENT_EXTENSION_BROWSER_CONTROLLER,
  CLIENT_RENDER_PROCESS_INTERNAL,
  CLIENT_RENDER_PROCESS_EXTERNAL,
  CLIENT_RENDER_PROCESS_BROWSER_CONTROLLER,
  SOCKET_PORT,
} = require('../../shared/constants/desktop')
const WebSocketServerStream = require('./web-socket-server-stream')

async function main () {
  await app.whenReady()

  const statusWindow = new BrowserWindow({
    width: 320,
    height: 380,
    webPreferences: {
      preload: path.resolve(__dirname, './preload.js')
    }
  })

  statusWindow.loadFile('../desktop.html')

  const onSocketConnection = (id, isConnected) => {
    statusWindow.webContents.send('socket-connection', {id, isConnected});
  };

  const webSocketServer = new WebSocketServer({ port: SOCKET_PORT });

  const extensionInternalStream = new WebSocketServerStream(
    webSocketServer, CLIENT_EXTENSION_INTERNAL, onSocketConnection, true);

  const extensionExternalStream = new WebSocketServerStream(
    webSocketServer, CLIENT_EXTENSION_EXTERNAL, onSocketConnection, true);

  const extensionBrowserControllerStream = new WebSocketServerStream(
    webSocketServer, CLIENT_EXTENSION_BROWSER_CONTROLLER, onSocketConnection);

  const renderProcessInternalStream = new WebSocketServerStream(
    webSocketServer, CLIENT_RENDER_PROCESS_INTERNAL, onSocketConnection);

  const renderProcessExternalStream = new WebSocketServerStream(
    webSocketServer, CLIENT_RENDER_PROCESS_EXTERNAL, onSocketConnection);

  const renderProcessBrowserControllerStream = new WebSocketServerStream(
    webSocketServer, CLIENT_RENDER_PROCESS_BROWSER_CONTROLLER, onSocketConnection);

  extensionInternalStream.pipe(renderProcessInternalStream).pipe(extensionInternalStream);
  extensionExternalStream.pipe(renderProcessExternalStream).pipe(extensionExternalStream);
  renderProcessBrowserControllerStream.pipe(extensionBrowserControllerStream);

  console.log('Created web socket server')

  const extensionPath = path.resolve(__dirname, '../../dist/chrome/')
  const { id } = await session.defaultSession.loadExtension(extensionPath)

  const homeWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false
  })

  homeWindow.maximize()
  homeWindow.loadURL(`chrome-extension://${id}/home.html`)
}

main()
