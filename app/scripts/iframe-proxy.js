const { ipcMain } = require('electron');

class IframeProxy {
    constructor(id, send) {
        this._id = id;
        this._send = (method, args = {}) => send('iframe', { id, method, args });

        this.contentWindow = {
            postMessage: (data, targetOrigin) => this._contentWindowPostMessage(data, targetOrigin)
        };
        
        this._send('createElement');
    }

    setAttribute(name, value) {
        if(name === 'id') {
            this.domId = value;
        }

        this._send('setAttribute', { name, value });
    }

    appendChild() {
        this._send('appendChild');
    }

    addEventListener(event, callback) {
        if(event !== 'load') return;

        this._loadCallback = callback;
        this._send('addLoadEventListener');
    }

    onLoad() {
        this._loadCallback();
    }

    remove() {
        this._send('remove');
    }

    _contentWindowPostMessage(data, targetOrigin) {
        this._send('postMessage', { data, targetOrigin });
    }
}

const initIframeGlobals = (send) => {
    let iframeCounter = 0;
    let iframesById = {};

    global.document = global.document || {};
    global.document.body = global.document.body || {};
    global.window = global.window || {};

    global.document.createElement = (tag) => {
        if(tag !== 'iframe') return;

        const iframeId = iframeCounter++;
        const iframe = new IframeProxy(iframeId, send);
        iframesById[iframeId] = iframe;

        return iframe;
    };
    
    global.document.getElementById = (id) => {
        return Object.values(iframesById).find(iframe => iframe.domId === id);
    };

    global.document.body.appendChild = (iframe) => {
        iframe.appendChild();
    };

    let windowMessageCallbacks = [];

    global.window.addEventListener = (event, callback) => {
        if(event !== 'message') return;

        windowMessageCallbacks.push(callback);
        send('window-message-listener', {});
    };

    global.window.removeEventListener = (event, callback) => {
        if(event !== 'message') return;

        const index = windowMessageCallbacks.indexOf(callback);
        
        windowMessageCallbacks.splice(index, 1);
    };

    ipcMain.handle('iframe-load', (event, data) => {
      const iframe = iframesById[data.id];
      iframe.onLoad();
    });

    ipcMain.handle('window-message', (event, data) => {
        const iframeId = data.iframeId;
        const source = iframesById[iframeId].contentWindow;

        windowMessageCallbacks.forEach(callback => {
            callback({ source, data: data.data });
        });
    });
};

module.exports = {
    initIframeGlobals
};