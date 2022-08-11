const { ipcRenderer } = require('electron')

const CLASS_CONNECTED = 'on'
const CLASS_DISCONNECTED = 'off'
const TEXT_CONNECTED = 'Connected'
const TEXT_DISCONNECTED = 'Disconnected'

window.addEventListener('DOMContentLoaded', () => {
    const renderProcessStatus = document.getElementById('render-process-status');
    const extensionStatus = document.getElementById('extension-status');

    ipcRenderer.on('render-process-connected', (event, value) => {
        renderProcessStatus.className = value === true ? CLASS_CONNECTED : CLASS_DISCONNECTED;
        renderProcessStatus.innerText = value === true ? TEXT_CONNECTED : TEXT_DISCONNECTED;
    })

    ipcRenderer.on('extension-connected', (event, value) => {
        extensionStatus.className = value === true ? CLASS_CONNECTED : CLASS_DISCONNECTED;
        extensionStatus.innerText = value === true ? TEXT_CONNECTED : TEXT_DISCONNECTED;
    })
})