const { app, BrowserWindow } = require('electron')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      devTools: true
    }
  })
  win.loadFile(__dirname + '/../../dist/chrome/desktop.html')

  // const devtools = new BrowserWindow()
  // win.webContents.setDevToolsWebContents(devtools.webContents)
  // win.webContents.openDevTools({ mode: 'detach' })
}

app.whenReady().then(() => {
  createWindow()
})