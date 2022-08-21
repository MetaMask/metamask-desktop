const { ipcRenderer } = require('electron');

window.electron = {
    mainProcess: {
        onMessage: (channel, callback) => ipcRenderer.on(channel, (event, data) => callback(data)),
        send: (channel, data) => ipcRenderer.invoke(channel, data)
    },
    log: (level, message, data) => ipcRenderer.invoke('log', { level, message, data })
};
