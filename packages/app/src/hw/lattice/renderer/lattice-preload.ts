import { contextBridge, ipcRenderer } from 'electron';

interface CredentialsResponse {
  result?: Record<string, any>;
  error?: string;
}

contextBridge.exposeInMainWorld('latticeApi', {
  addCredentialsListener: (callback: any) => {
    ipcRenderer.on('lattice-credentials', (_, payload: string) => {
      callback(payload);
    });
  },
  sendCredentialsResponse: (response: CredentialsResponse) => {
    ipcRenderer.send('lattice-credentials-response', response);
  },
});
