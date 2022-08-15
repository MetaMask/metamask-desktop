const path = require('path')
const { app, session, BrowserWindow } = require('electron')
const { createServer } = require('./extension-connection')

main();

async function main () {
  await app.whenReady();

  const statusWindow = await _createStatusWindow();

  const onSocketConnection = (clientId, isConnected) => {
    statusWindow.webContents.send('socket-connection', {clientId, isConnected});
  };

  await createServer(onSocketConnection);
  await _createHomeWindow();
}

async function _createStatusWindow() {
  const statusWindow = new BrowserWindow({
    width: 320,
    height: 380,
    webPreferences: {
      preload: path.resolve(__dirname, './preload.js')
    }
  });

  await statusWindow.loadFile('../desktop.html');

  console.log('Created status window');

  return statusWindow;
}

async function _createHomeWindow() {
  const extensionPath = path.resolve(__dirname, '../../dist/chrome/');
  const { id } = await session.defaultSession.loadExtension(extensionPath);

  const homeWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false
  });

  homeWindow.maximize();

  await homeWindow.loadURL(`chrome-extension://${id}/home.html`);

  console.log('Created home window');

  return homeWindow;
}
