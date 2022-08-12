const { ipcRenderer } = require('electron')

window.addEventListener('DOMContentLoaded', () => {
    ipcRenderer.on('socket-connection', (event, data) => {
        const status = document.getElementById(data.id);
        status.className = data.isConnected ? 'on' : 'off';
        status.innerText = data.isConnected ? 'Connected' : 'Disconnected';
    })
})