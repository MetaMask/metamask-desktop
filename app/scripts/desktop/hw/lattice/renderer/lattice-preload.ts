import { contextBridge, ipcRenderer } from 'electron';

type CredentialsResponse = {
  result?: Record<string, any>;
  error?: string;
};

contextBridge.exposeInMainWorld('latticeApi', {
  getCredentials: (callback: any) => {
    ipcRenderer.on('lattice-credentials', (_, payload: string) => {
      callback(payload);
    });
  },
  getCredentialsResponse: (response: CredentialsResponse) => {
    ipcRenderer.send('lattice-credentials-response', response);
  },
});
