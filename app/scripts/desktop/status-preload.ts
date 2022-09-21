import { ipcRenderer } from 'electron';
import { HandshakeMessage, StatusMessage } from './types/message';

const generateConnectionsTable = (connections: HandshakeMessage[]) => {
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

const _handleIframePostMessage = (
  _iframeId: any,
  iframe: any,
  args: any,
  _iframesById: any,
) => {
  iframe.contentWindow.postMessage(args.data, args.targetOrigin);
};

const _updateSnapsCount = (iframesById: any) => {
  const snapsCount = document.getElementById('snapsCount') as HTMLElement;
  snapsCount.innerText = Object.keys(iframesById).length.toString();
};

const _handleIframeRemove = (
  iframeId: any,
  iframe: any,
  _args: any,
  iframesById: any,
) => {
  iframe.remove();
  delete iframesById[iframeId];
  _updateSnapsCount(iframesById);
};

const _handleIframeCreateElement = (
  iframeId: any,
  _iframe: any,
  _args: any,
  iframesById: any,
) => {
  const newIframe = document.createElement('iframe');
  newIframe.setAttribute(
    'style',
    'position: absolute; width:0; height:0; border:0;',
  );
  newIframe.setAttribute(
    'sandbox',
    'allow-scripts allow-popups allow-same-origin',
  );

  console.log('IFRAME CREATED', newIframe);

  iframesById[iframeId] = newIframe;
};

const _handleIframeSetAttribute = (
  _iframeId: any,
  iframe: any,
  args: any,
  iframesById: any,
) => {
  iframe.setAttribute(args.name, args.value);

  if (args.name === 'id') {
    _updateSnapsCount(iframesById);
  }
};

const _handleIFrameAppendChild = (
  _iframeId: any,
  iframe: any,
  _args: any,
  _iframesById: any,
) => {
  document.body.appendChild(iframe);
};

const _handleIFrameAppendChildHead = (
  _iframeId: any,
  iframe: any,
  _args: any,
  _iframesById: any,
) => {
  document.head.appendChild(iframe);
};

const _handleIframeAddLoadEventListener = (
  iframeId: any,
  iframe: any,
  _args: any,
  _iframesById: any,
) => {
  iframe.addEventListener('load', () => {
    ipcRenderer.invoke('iframe-load', { id: iframeId });
  });
};

const _onIframeMessage = (data: any, iframesById: any) => {
  const iframeId = data.id;
  const iframe = iframesById[iframeId];

  // eslint-disable-next-line default-case
  switch (data.method) {
    case 'createElement':
      _handleIframeCreateElement(iframeId, iframe, data.args, iframesById);
      return;

    case 'setAttribute':
      _handleIframeSetAttribute(iframeId, iframe, data.args, iframesById);
      return;

    case 'appendChild':
      _handleIFrameAppendChild(iframeId, iframe, data.args, iframesById);
      return;

    case 'appendChildHead':
      _handleIFrameAppendChildHead(iframeId, iframe, data.args, iframesById);
      return;

    case 'addLoadEventListener':
      _handleIframeAddLoadEventListener(
        iframeId,
        iframe,
        data.args,
        iframesById,
      );
      return;

    case 'postMessage':
      _handleIframePostMessage(iframeId, iframe, data.args, iframesById);
      return;

    case 'remove':
      _handleIframeRemove(iframeId, iframe, data.args, iframesById);
      // eslint-disable-next-line no-useless-return
      return;
  }
};

const _handleIframeMessages = () => {
  const iframesById: any = {};
  let hasWindowMessageListener = false;

  ipcRenderer.on('iframe', (_event, data) => {
    console.log('IFRAME MESSAGE', { _event, data, iframesById });
    return _onIframeMessage(data, iframesById);
  });

  ipcRenderer.on('window-message-listener', (_event, _data) => {
    console.log('WINDOW MESSAGE', { _event, _data, iframesById });
    if (hasWindowMessageListener) {
      return;
    }

    window.addEventListener(
      'message',
      (event) => {
        const iframeId = Object.keys(iframesById).find(
          (id) => iframesById[id].contentWindow === event.source,
        );
        ipcRenderer.invoke('window-message', { iframeId, data: event.data });
      },
      false,
    );

    hasWindowMessageListener = true;
  });
};

const onLoad = () => {
  ipcRenderer.on('status', (_, data: StatusMessage) => onStatusMessage(data));
  _handleIframeMessages();
};

window.addEventListener('DOMContentLoaded', () => onLoad());
