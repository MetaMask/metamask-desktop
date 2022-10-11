import { autoUpdater } from 'electron-updater';
import { dialog, MessageBoxReturnValue } from 'electron';
import log from 'loglevel';
import cfg from '../utils/config';
import { simulateNodeEvent } from '../test/utils';
import { updateCheck } from './update-check';

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
  let autoUpdaterMock: jest.Mocked<typeof autoUpdater>;
  let dialogMock: jest.Mocked<typeof dialog>;
  let logMock: jest.Mocked<typeof log>;

  beforeEach(() => {
    jest.resetAllMocks();

    cfg().desktop.enableUpdates = true;

    autoUpdaterMock = autoUpdater as any;
    autoUpdaterMock.isUpdaterActive.mockReturnValue(true);

    dialogMock = dialog as any;
    logMock = log as any;
  });

  describe('updateCheck', () => {
    it('checks for updates', async () => {
      await updateCheck();
      expect(autoUpdaterMock.checkForUpdates).toHaveBeenCalledTimes(1);
    });

    it('does nothing if updates disabled', async () => {
      cfg().desktop.enableUpdates = false;

      await updateCheck();

      expect(autoUpdaterMock.checkForUpdates).toHaveBeenCalledTimes(0);
      expect(autoUpdaterMock.on).toHaveBeenCalledTimes(0);
    });

    it('does nothing if updater not active', async () => {
      autoUpdaterMock.isUpdaterActive.mockReturnValue(false);

      await updateCheck();

      expect(autoUpdaterMock.checkForUpdates).toHaveBeenCalledTimes(0);
      expect(autoUpdaterMock.on).toHaveBeenCalledTimes(0);
    });
  });

  describe('on error', () => {
    it.each([
      ['error is string', 'Test Error', 'Test Error'],
      ['error has stack', { stack: 'Test Stack' }, 'Test Stack'],
      ['error is null', null, 'unknown'],
    ])('displays error box if %s', async (_, error, errorBoxMessage) => {
      await updateCheck();
      await simulateNodeEvent(autoUpdaterMock, 'error', error);

      expect(dialogMock.showErrorBox).toHaveBeenCalledTimes(1);
      expect(dialogMock.showErrorBox).toHaveBeenCalledWith(
        expect.any(String),
        errorBoxMessage,
      );
    });
  });

  describe('on update-available', () => {
    it('displays message box', async () => {
      dialogMock.showMessageBox.mockResolvedValueOnce({
        response: 1,
      } as MessageBoxReturnValue);

      await updateCheck();
      await simulateNodeEvent(autoUpdaterMock, 'update-available');

      expect(dialogMock.showMessageBox).toHaveBeenCalledTimes(1);
      expect(dialogMock.showMessageBox).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Found Updates' }),
      );
    });

    it('does nothing if message box cancelled', async () => {
      dialogMock.showMessageBox.mockResolvedValueOnce({
        response: 1,
      } as MessageBoxReturnValue);

      await updateCheck();
      await simulateNodeEvent(autoUpdaterMock, 'update-available');

      expect(autoUpdaterMock.downloadUpdate).toHaveBeenCalledTimes(0);
    });

    it('downloads update if message box confirmed', async () => {
      dialogMock.showMessageBox.mockResolvedValueOnce({
        response: 0,
      } as MessageBoxReturnValue);

      await updateCheck();
      await simulateNodeEvent(autoUpdaterMock, 'update-available');

      expect(autoUpdaterMock.downloadUpdate).toHaveBeenCalledTimes(1);
    });
  });

  describe('on update-not-available', () => {
    it('logs to console', async () => {
      await updateCheck();
      await simulateNodeEvent(autoUpdaterMock, 'update-not-available');

      expect(logMock.debug).toHaveBeenCalledTimes(1);
      expect(logMock.debug).toHaveBeenCalledWith(
        'Current version is up-to-date.',
      );
    });
  });

  describe('on update-downloaded', () => {
    it('displays message box', async () => {
      dialogMock.showMessageBox.mockResolvedValueOnce(
        {} as MessageBoxReturnValue,
      );

      await updateCheck();
      await simulateNodeEvent(autoUpdaterMock, 'update-downloaded');

      expect(dialogMock.showMessageBox).toHaveBeenCalledTimes(1);
      expect(dialogMock.showMessageBox).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Install Updates' }),
      );
    });

    it('quits and installs once message box closed', async () => {
      dialogMock.showMessageBox.mockResolvedValueOnce(
        {} as MessageBoxReturnValue,
      );

      await updateCheck();
      await simulateNodeEvent(autoUpdaterMock, 'update-downloaded');

      expect(autoUpdater.quitAndInstall).toHaveBeenCalledTimes(1);
    });
  });

  describe('on download-progress', () => {
    it('logs to console', async () => {
      const downloadProgressMock = { progress: 52 };

      await updateCheck();

      await simulateNodeEvent(
        autoUpdaterMock,
        'download-progress',
        downloadProgressMock,
      );

      expect(logMock.debug).toHaveBeenCalledTimes(1);
      expect(logMock.debug).toHaveBeenCalledWith(
        'Download progress',
        downloadProgressMock,
      );
    });
  });
});
