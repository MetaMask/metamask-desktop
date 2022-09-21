import { ipcMain } from 'electron';

class IframeProxy {
  private _id: any;

  private _send: any;

  private _loadCallback: any;

  public contentWindow: any;

  public domId: any;

  constructor(id: any, send: any) {
    this._id = id;
    this._send = (method: any, args = {}) =>
      send('iframe', { id, method, args });

    this.contentWindow = {
      postMessage: (data: any, targetOrigin: any) => {
        console.log('IFRAME POSTING MESSAGE', { data, targetOrigin });
        return this._contentWindowPostMessage(data, targetOrigin);
      },
    };

    this._send('createElement');
  }

  private _src: string | undefined;

  public get src(): string | undefined {
    return this._src;
  }

  public set src(_src: string | undefined) {
    this._src = _src;
    this.setAttribute('src', _src);
  }

  private _allow: string | undefined;

  public get allow(): string | undefined {
    return this._allow;
  }

  public set allow(_allow: string | undefined) {
    this._allow = _allow;
    this.setAttribute('allow', _allow);
  }

  setAttribute(name: any, value: any) {
    if (name === 'id') {
      this.domId = value;
    }

    this._send('setAttribute', { name, value });
  }

  appendChild() {
    this._send('appendChild');
  }

  appendChildHead() {
    this._send('appendChildHead');
  }

  addEventListener(event: any, callback: any) {
    if (event !== 'load') {
      return;
    }

    this._loadCallback = callback;
    this._send('addLoadEventListener');
  }

  onLoadCallback() {
    this._loadCallback();
  }

  public get onload():
    | ((this: GlobalEventHandlers, ev: Event) => any)
    | undefined {
    return this._loadCallback;
  }

  public set onload(
    _onload: ((this: GlobalEventHandlers, ev: Event) => any) | undefined,
  ) {
    this.addEventListener('load', _onload);
  }

  remove() {
    this._send('remove');
  }

  private _contentWindowPostMessage(data: any, targetOrigin: any) {
    this._send('postMessage', { data, targetOrigin });
  }
}

export const initIframeGlobals = (send: any) => {
  let iframeCounter = 0;
  const iframesById: any = {};

  global.document = global.document || {};
  global.document.body = global.document.body || {};
  if (!global.document?.head) {
    (global.document as any).head = {};
  }
  global.window = global.window || {};

  global.document.createElement = (tag: any) => {
    if (tag !== 'iframe') {
      return;
    }

    const iframeId = iframeCounter;
    iframeCounter += 1;

    const iframe = new IframeProxy(iframeId, send);
    iframesById[iframeId] = iframe;

    // eslint-disable-next-line consistent-return
    return iframe as any;
  };

  global.document.getElementById = (id) => {
    return Object.values(iframesById).find(
      (iframe: any) => iframe.domId === id,
    ) as HTMLElement | null;
  };

  global.document.body.appendChild = (iframe: any) => {
    return iframe.appendChild();
  };

  global.document.head.appendChild = (iframe: any) => {
    return iframe.appendChildHead();
  };

  const windowMessageCallbacks: any[] = [];

  global.window.addEventListener = (event: any, callback: any) => {
    if (event !== 'message') {
      return;
    }

    windowMessageCallbacks.push(callback);
    send('window-message-listener', {});
  };

  global.window.removeEventListener = (event: any, callback: any) => {
    if (event !== 'message') {
      return;
    }

    const index = windowMessageCallbacks.indexOf(callback);

    windowMessageCallbacks.splice(index, 1);
  };

  ipcMain.handle('iframe-load', (_event, data: any) => {
    const iframe = iframesById[data.id];
    iframe.onLoadCallback();
  });

  ipcMain.handle('window-message', (_event, data: any) => {
    const { iframeId } = data;
    const source = iframesById[iframeId].contentWindow;

    windowMessageCallbacks.forEach((callback) => {
      callback({ source, data: data.data });
    });
  });
};
