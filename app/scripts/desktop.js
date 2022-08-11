const path = require('path')
const { app, session, BrowserWindow } = require('electron')
const WebSocketServer  = require('ws').Server
const {
  CLIENT_EXTENSION_INTERNAL,
  CLIENT_EXTENSION_EXTERNAL,
  CLIENT_RENDER_PROCESS_INTERNAL,
  CLIENT_RENDER_PROCESS_EXTERNAL,
  SOCKET_PORT
} = require('../../shared/constants/desktop')
const WebSocketServerStream = require('./web-socket-server-stream')

async function main () {
  await app.whenReady()

  const statusWindow = new BrowserWindow({
    width: 270,
    height: 100,
    webPreferences: {
      preload: path.resolve(__dirname, './preload.js')
    }
  })

  statusWindow.loadFile('../desktop.html')

  const onExtensionConnected = () => {
    statusWindow.webContents.send('extension-connected', true);
  };

  const onRenderProcessConnected = () => {
    statusWindow.webContents.send('render-process-connected', true);
  }

  const webSocketServer = new WebSocketServer({ port: SOCKET_PORT });

  const extensionInternalStream = new WebSocketServerStream(
    webSocketServer, CLIENT_EXTENSION_INTERNAL, onExtensionConnected, true);

  const extensionExternalStream = new WebSocketServerStream(
    webSocketServer, CLIENT_EXTENSION_EXTERNAL, () => {}, true);

  const renderProcessInternalStream = new WebSocketServerStream(
    webSocketServer, CLIENT_RENDER_PROCESS_INTERNAL, onRenderProcessConnected);

  const renderProcessExternalStream = new WebSocketServerStream(
    webSocketServer, CLIENT_RENDER_PROCESS_EXTERNAL);

  extensionInternalStream.pipe(renderProcessInternalStream).pipe(extensionInternalStream);
  extensionExternalStream.pipe(renderProcessExternalStream).pipe(extensionExternalStream);

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
