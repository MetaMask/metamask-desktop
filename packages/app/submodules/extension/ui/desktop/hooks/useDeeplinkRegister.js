import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';

// eslint-disable-next-line node/no-extraneous-require
const { ipcRenderer } = window.require('electron');

export default function useDeeplinkRegister() {
  const history = useHistory();
  useEffect(() => {
    // Register listeners from the main process to the renderer process
    ipcRenderer.on('url-request', (_, url) => {
      // Remove protocol & redirect to the url
      const path = url.replace('metamask-desktop://', '/');
      history.replace(path);
    });
  }, [history]);
}
