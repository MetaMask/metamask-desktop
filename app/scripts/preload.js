const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => _onLoad());

const _onLoad = () => {
    _handleSocketConnectionMessages();
};

const _handleSocketConnectionMessages = () => {
    ipcRenderer.on('socket-connection', (event, data) => _onSocketConnectionMessage(data));
};

const _onSocketConnectionMessage = (data) => {
    const status = document.getElementById(data.clientId);
    status.className = data.isConnected ? 'on' : 'off';
    status.innerText = data.isConnected ? 'Connected' : 'Disconnected';
};
