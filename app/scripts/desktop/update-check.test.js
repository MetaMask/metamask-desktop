import { autoUpdater } from 'electron-updater';
import { dialog } from 'electron';
import log from 'loglevel';
import { updateCheck } from './update-check';
import cfg from './config';
import { simulateNodeEvent } from './test/utils';

jest.mock(
  'electron-updater',
  () => ({
    autoUpdater: {
      on: jest.fn(),
      isUpdaterActive: jest.fn(),
      checkForUpdates: jest.fn(),
      downloadUpdate: jest.fn(),
      quitAndInstall: jest.fn(),
    },
  }),
  { virtual: true },
);

jest.mock(
  'electron',
  () => ({
    dialog: {
      showErrorBox: jest.fn(),
      showMessageBox: jest.fn(),
    },
  }),
  { virtual: true },
);

jest.mock(
  'loglevel',
  () => ({
    debug: jest.fn(),
  }),
  { virtual: true },
);

describe('Update Check', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    cfg().desktop.enableUpdates = true;
    autoUpdater.isUpdaterActive.mockReturnValue(true);
  });

  describe('updateCheck', () => {
    it('checks for updates', async () => {
      await updateCheck();
      expect(autoUpdater.checkForUpdates).toHaveBeenCalledTimes(1);
    });

    it('does nothing if updates disabled', async () => {
      cfg().desktop.enableUpdates = false;

      await updateCheck();

      expect(autoUpdater.checkForUpdates).toHaveBeenCalledTimes(0);
      expect(autoUpdater.on).toHaveBeenCalledTimes(0);
    });

    it('does nothing if updater not active', async () => {
      autoUpdater.isUpdaterActive.mockReturnValue(false);

      await updateCheck();

      expect(autoUpdater.checkForUpdates).toHaveBeenCalledTimes(0);
      expect(autoUpdater.on).toHaveBeenCalledTimes(0);
    });
  });

  describe('on error', () => {
    it.each([
      ['error is string', 'Test Error', 'Test Error'],
      ['error has stack', { stack: 'Test Stack' }, 'Test Stack'],
      ['error is null', null, 'unknown'],
    ])('displays error box if %s', async (_, error, errorBoxMessage) => {
      await updateCheck();
      await simulateNodeEvent(autoUpdater, 'error', error);

      expect(dialog.showErrorBox).toHaveBeenCalledTimes(1);
      expect(dialog.showErrorBox).toHaveBeenCalledWith(
        expect.any(String),
        errorBoxMessage,
      );
    });
  });

  describe('on update-available', () => {
    it('displays message box', async () => {
      dialog.showMessageBox.mockResolvedValueOnce({ response: 1 });

      await updateCheck();
      await simulateNodeEvent(autoUpdater, 'update-available');

      expect(dialog.showMessageBox).toHaveBeenCalledTimes(1);
      expect(dialog.showMessageBox).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Found Updates' }),
      );
    });

    it('does nothing if message box cancelled', async () => {
      dialog.showMessageBox.mockResolvedValueOnce({ response: 1 });

      await updateCheck();
      await simulateNodeEvent(autoUpdater, 'update-available');

      expect(autoUpdater.downloadUpdate).toHaveBeenCalledTimes(0);
    });

    it('downloads update if message box confirmed', async () => {
      dialog.showMessageBox.mockResolvedValueOnce({ response: 0 });

      await updateCheck();
      await simulateNodeEvent(autoUpdater, 'update-available');

      expect(autoUpdater.downloadUpdate).toHaveBeenCalledTimes(1);
    });
  });

  describe('on update-not-available', () => {
    it('logs to console', async () => {
      await updateCheck();
      await simulateNodeEvent(autoUpdater, 'update-not-available');

      expect(log.debug).toHaveBeenCalledTimes(1);
      expect(log.debug).toHaveBeenCalledWith('Current version is up-to-date.');
    });
  });

  describe('on update-downloaded', () => {
    it('displays message box', async () => {
      dialog.showMessageBox.mockResolvedValueOnce({});

      await updateCheck();
      await simulateNodeEvent(autoUpdater, 'update-downloaded');

      expect(dialog.showMessageBox).toHaveBeenCalledTimes(1);
      expect(dialog.showMessageBox).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Install Updates' }),
      );
    });

    it('quits and installs once message box closed', async () => {
      dialog.showMessageBox.mockResolvedValueOnce({});

      await updateCheck();
      await simulateNodeEvent(autoUpdater, 'update-downloaded');

      expect(autoUpdater.quitAndInstall).toHaveBeenCalledTimes(1);
    });
  });

  describe('on download-progress', () => {
    it('logs to console', async () => {
      const downloadProgressMock = { progress: 52 };

      await updateCheck();

      await simulateNodeEvent(
        autoUpdater,
        'download-progress',
        downloadProgressMock,
      );

      expect(log.debug).toHaveBeenCalledTimes(1);
      expect(log.debug).toHaveBeenCalledWith(
        'Download progress',
        downloadProgressMock,
      );
    });
  });
});
