import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';

export default function useDeeplinkRegister() {
  const history = useHistory();
  useEffect(() => {
    // Register listeners from the main process to the renderer process
    window.electronBridge.onUrlRequests((url) => {
      // Remove protocol & redirect to the url
      const path = url.replace('metamask-desktop://', '/');
      history.replace(path);
    });
  }, [history]);
}
