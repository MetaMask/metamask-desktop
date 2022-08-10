const path = require('path')
const { app, session, BrowserWindow } = require('electron')
const WebSocketServerRouter = require('./web-socket-server-router')
const WebSocketServer  = require('ws').Server
const {
  CLIENT_EXTENSION_INTERNAL,
  CLIENT_EXTENSION_EXTERNAL,
  CLIENT_RENDER_PROCESS_INTERNAL,
  CLIENT_RENDER_PROCESS_EXTERNAL,
  SOCKET_PORT
} = require('../../shared/constants/desktop')

async function main () {
  await app.whenReady()

  const webSocketServer = new WebSocketServer({ port: SOCKET_PORT });

  const router = new WebSocketServerRouter(webSocketServer)
    .withRoute(CLIENT_EXTENSION_INTERNAL, CLIENT_RENDER_PROCESS_INTERNAL, true)
    .withRoute(CLIENT_RENDER_PROCESS_INTERNAL, CLIENT_EXTENSION_INTERNAL)
    .withRoute(CLIENT_EXTENSION_EXTERNAL, CLIENT_RENDER_PROCESS_EXTERNAL, true)
    .withRoute(CLIENT_RENDER_PROCESS_EXTERNAL, CLIENT_EXTENSION_EXTERNAL)

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

  const statusWindow = new BrowserWindow({
    width: 270,
    height: 100,
    webPreferences: {
      preload: path.resolve(__dirname, './preload.js')
    }
  })

  statusWindow.loadFile('../desktop.html')

  router.onClientConnect(CLIENT_EXTENSION_INTERNAL, () => {
    statusWindow.webContents.send('extension-connected', true)
  })

  router.onClientConnect(CLIENT_RENDER_PROCESS_INTERNAL, () => {
    statusWindow.webContents.send('render-process-connected', true)
  })
}

main()
