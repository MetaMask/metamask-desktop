import { ipcRenderer } from 'electron';
import { NewConnectionMessage, StatusMessage } from './types/message';

const generateConnectionsTable = (connections: NewConnectionMessage[]) => {
  return connections
    .map(
      (connection) => `\
        <tr> \
            <td>${connection.remotePort.name}</td> \
            <td>${connection.remotePort.sender.url}</td> \
        </tr>`,
    )
    .join('');
};

const updateConnections = (data: StatusMessage) => {
  const connectionsContainer = document.getElementById('connections');
  const connectionsTable = document.getElementById('connections-table');
  const noConnectionsMessage = document.getElementById('no-connections');
  const hasConnections = Boolean(data.connections?.length);

  if (!connectionsContainer || !connectionsTable || !noConnectionsMessage) {
    console.error('Cannot find required elements to display connections', {
      connectionsContainer,
      connectionsTable,
      noConnectionsMessage,
    });

    return;
  }

  connectionsContainer.hidden = !hasConnections;
  noConnectionsMessage.hidden = hasConnections;

  connectionsTable.innerHTML = hasConnections
    ? generateConnectionsTable(data.connections)
    : '';
};

const updateWebSocketStatus = (data: StatusMessage) => {
  const webSocketStatus = document.getElementById('web-socket');

  if (!webSocketStatus) {
    console.error('Cannot find web socket status element');
    return;
  }

  webSocketStatus.innerText = data.isWebSocketConnected
    ? 'Connected'
    : 'Disconnected';

  webSocketStatus.className = data.isWebSocketConnected ? 'on' : 'off';
};

const onStatusMessage = (data: StatusMessage) => {
  updateWebSocketStatus(data);
  updateConnections(data);
};

const onLoad = () => {
  ipcRenderer.on('status', (_, data: StatusMessage) => onStatusMessage(data));
};

window.addEventListener('DOMContentLoaded', () => onLoad());
