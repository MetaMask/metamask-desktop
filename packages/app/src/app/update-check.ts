import { dialog } from 'electron';
import { autoUpdater, UpdateCheckResult } from 'electron-updater';
import log from 'loglevel';
import cfg from '../utils/config';

export const updateCheck = async (): Promise<UpdateCheckResult | null> => {
  if (!cfg().enableUpdates || !autoUpdater.isUpdaterActive()) {
    log.debug('Updater not active');
    return null;
  }

  autoUpdater.logger = log;
  autoUpdater.autoDownload = false;

  autoUpdater.on('error', (error) => {
    dialog.showErrorBox(
      'Error: ',
      error === null ? 'unknown' : (error.stack || error).toString(),
    );
  });

  autoUpdater.on('update-available', () => {
    dialog
      .showMessageBox({
        type: 'info',
        title: 'Found Updates',
        message: 'Found updates, do you want update now?',
        buttons: ['Sure', 'No'],
      })
      .then((messageBoxReturnValue) => {
        if (messageBoxReturnValue.response === 0) {
          autoUpdater.downloadUpdate();
        }
      });
  });

  autoUpdater.on('update-not-available', () => {
    log.debug('Current version is up-to-date.');
  });

  autoUpdater.on('update-downloaded', () => {
    dialog
      .showMessageBox({
        title: 'Install Updates',
        message: 'Updates downloaded, application will be quit for update...',
      })
      .then(() => {
        setImmediate(() => autoUpdater.quitAndInstall());
      });
  });

  autoUpdater.on('download-progress', (progressInfo) => {
    log.debug('Download progress', progressInfo);
  });

  return autoUpdater.checkForUpdates();
};
