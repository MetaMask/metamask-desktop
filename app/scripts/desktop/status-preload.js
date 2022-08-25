const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => _onLoad());

const _onLoad = () => {
    _handleStatusMessage();
    _handlePasswordChange();
};

const _handlePasswordChange = () => {
    const saveButton = document.getElementById('save-button');
    saveButton.addEventListener('click', () => {
        const passwordInput = document.getElementById('password')
        const password = passwordInput.value;
        _onPasswordSave(password);

        passwordInput.setAttribute('disabled', true);
        saveButton.setAttribute('disabled', true);
    });
};

const _handleStatusMessage = () => {
    ipcRenderer.on('status', (event, data) => _onStatusMessage(data));
};

const _onPasswordSave = (value) => {
    ipcRenderer.invoke('password', value);
};

const _onStatusMessage = (data) => {
    const connections = document.getElementById('connections');
    const connectionsList = document.getElementById('connections-table');
    const noConnectionsMessage = document.getElementById('no-connections');

    _updateStatus('server', data.isServerReady, 'Ready', 'Not Ready');
    _updateStatus('extension', data.isExtensionConnected, 'Connected', 'Disconnected');
    _updateStatus('security', data.isEncrypted, 'Encrypted', 'Unencrypted');

    if(data.connections.length) {
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

const _updateStatus = (id, on, onText, offText) => {
    const element = document.getElementById(id);
    element.innerText = on ? onText : offText;
    element.className = on ? 'on' : 'off';
};
