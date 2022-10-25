import { DATA_MOCK } from '../test/mocks';
import { browser } from '../browser/browser-polyfill';
import * as RawState from './raw-state';

jest.mock(
  '../browser/browser-polyfill',
  () => ({
    browser: {
      storage: { local: { get: jest.fn(), set: jest.fn(), clear: jest.fn() } },
    },
  }),
  {
    virtual: true,
  },
);

describe('Raw State Utils', () => {
  const browserMock = browser as any;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('get', () => {
    it('returns browser local storage', async () => {
      browserMock.storage.local.get.mockResolvedValueOnce(DATA_MOCK);
      expect(await RawState.get()).toStrictEqual(DATA_MOCK);
    });
  });

  describe('getDesktopState', () => {
    it('returns desktop controller state from browser local storage', async () => {
      browserMock.storage.local.get.mockResolvedValueOnce({
        data: { DesktopController: { desktopEnabled: true } },
      });

      expect(await RawState.getDesktopState()).toStrictEqual({
        desktopEnabled: true,
      });
    });
  });

  describe('getAndUpdateDesktopState', () => {
    it('returns state from browser local storage and mutates desktop controller state', async () => {
      browserMock.storage.local.get.mockResolvedValueOnce({
        data: { DesktopController: { desktopEnabled: false } },
      });

      expect(
        (await RawState.getAndUpdateDesktopState({ desktopEnabled: true })).data
          .DesktopController,
      ).toStrictEqual({ desktopEnabled: true });
    });
  });

  describe('set', () => {
    it('updates browser local storage', async () => {
      await RawState.set(DATA_MOCK);

      expect(browserMock.storage.local.set).toHaveBeenCalledTimes(1);
      expect(browserMock.storage.local.set).toHaveBeenCalledWith(DATA_MOCK);
    });
  });

  describe('setDesktopState', () => {
    it('updates desktop controller state in browser local storage', async () => {
      browserMock.storage.local.get.mockResolvedValueOnce({
        data: { test: {}, DesktopController: { desktopEnabled: false } },
      });

      await RawState.setDesktopState({ desktopEnabled: true });

      expect(browserMock.storage.local.set).toHaveBeenCalledTimes(1);
      expect(browserMock.storage.local.set).toHaveBeenCalledWith({
        data: { test: {}, DesktopController: { desktopEnabled: true } },
      });
    });
  });

  describe('clear', () => {
    it('clears browser local storage', async () => {
      await RawState.clear();
      expect(browserMock.storage.local.clear).toHaveBeenCalledTimes(1);
    });
  });
});
