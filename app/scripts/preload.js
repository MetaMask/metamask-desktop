const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => _onLoad());

const _onLoad = () => {
    _handleSocketConnectionMessages();
    _handleIframeMessages();
};

const _handleSocketConnectionMessages = () => {
    ipcRenderer.on('socket-connection', (event, data) => _onSocketConnectionMessage(data));
};

const _onSocketConnectionMessage = (data) => {
    const status = document.getElementById(data.clientId);
    status.className = data.isConnected ? 'on' : 'off';
    status.innerText = data.isConnected ? 'Connected' : 'Disconnected';
};

const _handleIframeMessages = () => {
    let iframesById = {};
    let hasWindowMessageListener = false;

    ipcRenderer.on('iframe', (event, data) => _onIframeMessage(data, iframesById));

    ipcRenderer.on('window-message-listener', (event, data) => {
        if(hasWindowMessageListener) return;

        window.addEventListener('message', (event) => {
            const iframeId = Object.keys(iframesById).find(iframeId => iframesById[iframeId].contentWindow === event.source);
            ipcRenderer.invoke('window-message', { iframeId, data: event.data });
        }, false);

        hasWindowMessageListener = true;
    });
};

const _onIframeMessage = (data, iframesById) => {
    const iframeId = data.id;
    const iframe = iframesById[iframeId];

    switch(data.method) {
        case 'createElement':
            _handleIframeCreateElement(iframeId, iframe, data.args, iframesById);
            return;

        case 'setAttribute':
            _handleIframeSetAttribute(iframeId, iframe, data.args, iframesById);
            return;

        case 'appendChild':
            _handleIFrameAppendChild(iframeId, iframe, data.args, iframesById);
            return;

        case 'addLoadEventListener': 
            _handleIframeAddLoadEventListener(iframeId, iframe, data.args, iframesById);
            return;
        
        case 'postMessage':
            _handleIframePostMessage(iframeId, iframe, data.args, iframesById);
            return;

        case 'remove': 
            _handleIframeRemove(iframeId, iframe, data.args, iframesById);
            return;     
    }
};

const _handleIframeCreateElement = (iframeId, iframe, args, iframesById) => {
    const newIframe = document.createElement('iframe');
    newIframe.setAttribute('style', 'position: absolute; width:0; height:0; border:0;');

    iframesById[iframeId] = newIframe;
};

const _handleIframeSetAttribute = (iframeId, iframe, args, iframesById) => {
    iframe.setAttribute(args.name, args.value);

    if(args.name === 'id') {
        _updateSnapsCount(iframesById);
    }
};

const _handleIFrameAppendChild = (iframeId, iframe, args, iframesById) => {
    document.body.appendChild(iframe);
};

const _handleIframeAddLoadEventListener = (iframeId, iframe, args, iframesById) => {
    iframe.addEventListener('load', () => {
        ipcRenderer.invoke('iframe-load', {id: iframeId});
    });
};

const _handleIframePostMessage = (iframeId, iframe, args, iframesById) => {
    iframe.contentWindow.postMessage(args.data, args.targetOrigin);  
};

const _handleIframeRemove = (iframeId, iframe, args, iframesById) => {
    iframe.remove();
    delete iframesById[iframeId];
    _updateSnapsCount(iframesById);
};

const _updateSnapsCount = (iframesById) => {
    document.getElementById('snapsCount').innerText = Object.keys(iframesById).length;
};