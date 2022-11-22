import { browser } from '../browser';
import { DATA_MOCK } from '../../test/mocks';
import * as RawState from './state';

jest.mock(
  '../browser',
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

  describe('getRawState', () => {
    it('returns browser local storage', async () => {
      browserMock.storage.local.get.mockResolvedValueOnce(DATA_MOCK);
      expect(await RawState.getRawState()).toStrictEqual(DATA_MOCK);
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

  describe('setRawState', () => {
    it('updates browser local storage', async () => {
      await RawState.setRawState(DATA_MOCK as any);

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

  describe('clearRawState', () => {
    it('clears browser local storage', async () => {
      await RawState.clearRawState();
      expect(browserMock.storage.local.clear).toHaveBeenCalledTimes(1);
    });
  });
});
