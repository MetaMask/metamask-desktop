import { contextBridge, ipcRenderer } from 'electron';

type OpenWindowResponse = {
  result?: Record<string, any>;
  error?: string;
};

contextBridge.exposeInMainWorld('latticeApi', {
  openWindowSetup: (callback: any) => {
    ipcRenderer.on('lattice-open-window', (_, payload: string) => {
      callback(payload);
    });
  },
  openWindowResponse: (response: OpenWindowResponse) => {
    ipcRenderer.send('lattice-open-window-response', response);
  },
});
