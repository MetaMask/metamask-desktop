const path = require('path')
const { app, session, BrowserWindow } = require('electron')

main()

async function main () {
  await app.whenReady()
  const extensionPath = path.resolve(__dirname, '../../dist/chrome/')
  const { id } = await session.defaultSession.loadExtension(extensionPath)
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
  })
  win.maximize()
  win.loadURL(`chrome-extension://${id}/home.html`)
  win.show()
}
