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

const updateDesktopSynced = () => {
  const mainContentDiv = document.getElementById('main-content');

  if (!mainContentDiv) {
    console.error('Cannot find main content element');
    return;
  }

  mainContentDiv.innerHTML = `<h2>All set, fox</h2>
    <span>Some explainer about using the extension as usual but keep this \n app open and check the alerts.</span>
    <div><button id="connections-button" >Continue with Extension</button></div>`;
};

const onStatusMessage = (data: StatusMessage) => {
  updateWebSocketStatus(data);
  updateConnections(data);
  if (data.isDesktopSynced) {
    updateDesktopSynced();
  }
};

const onOTPSubmit = (value: string) => {
  ipcRenderer.invoke('otp', value);
};

const handleOTPChange = () => {
  const submitButton = document.getElementById('submit-button');

  if (!submitButton) {
    console.error('Cannot find submit button element');
    return;
  }

  submitButton.addEventListener('click', () => {
    const otpInput = (document.getElementById('otp-value') as HTMLInputElement)
      .value;
    onOTPSubmit(otpInput);
  });
};

const onHandleInvalidOTP = (isValid: boolean) => {
  const invalidOTP = document.getElementById('invalid-otp');
  if (!invalidOTP) {
    console.error('Cannot find invalid otp element');
    return;
  }

  if (isValid) {
    invalidOTP.className = 'show';
  }
};

const loadOTPInput = () => {
  const startButton = document.getElementById('start-button');
  const startDiv = document.getElementById('start-div');

  const otpInput = document.getElementById('input-otp');

  if (!otpInput || !startDiv || !startButton) {
    console.error('Cannot find element');
    return;
  }

  startButton.addEventListener('click', () => {
    otpInput.className = 'show';
    startDiv.className = 'hide';
  });
};

const onLoad = () => {
  ipcRenderer.on('status', (_, data: StatusMessage) => onStatusMessage(data));
  ipcRenderer.on('otp-invalid', (_, data: boolean) => onHandleInvalidOTP(data));
  loadOTPInput();
  handleOTPChange();
};

window.addEventListener('DOMContentLoaded', () => onLoad());
