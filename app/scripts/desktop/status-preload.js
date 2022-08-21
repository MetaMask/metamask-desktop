const { ipcRenderer, contextBridge } = require('electron');

window.addEventListener('DOMContentLoaded', () => _onLoad());

const _onLoad = () => {
    _handleStatusMessage();
};

const _handleStatusMessage = () => {
    ipcRenderer.on('status', (event, data) => _onStatusMessage(data));
};

const _onStatusMessage = (data) => {
    const webSocketStatus = document.getElementById('web-socket');
    const connections = document.getElementById('connections');
    const connectionsList = document.getElementById('connections-table');
    const noConnectionsMessage = document.getElementById('no-connections');

    webSocketStatus.innerText = data.isWebSocketConnected ? 'Connected' : 'Disconnected';
    webSocketStatus.className = data.isWebSocketConnected ? 'on' : 'off';

    if(data.connections?.length) {
        connections.hidden = false;
        noConnectionsMessage.hidden = true;

        connectionsList.innerHTML = data.connections.map(connection => `\
            <tr> \
                <td>${connection.remotePort.name}</td> \
                <td>${connection.remotePort.sender.url}</td> \
            </tr>`
        ).join('');
    } else {
        connections.hidden = true;
        noConnectionsMessage.hidden = false;
        connectionsList.innerHTML = '';
    }
};
