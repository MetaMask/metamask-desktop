import { ObservableStore } from '@metamask/obs-store';
import {
  createObservableStoreMock,
  OTP_MOCK,
  TEST_CONNECTION_RESULT_MOCK,
} from '../../test/mocks';
import {
  AppLogic,
  DesktopController,
  ExtensionLogic,
  initDesktopControllerAppLogic,
  initDesktopControllerExtensionLogic,
} from './desktop';

jest.mock('@metamask/obs-store');

describe('Desktop Controller', () => {
  const storeMock = createObservableStoreMock();

  const extensionLogicMock = {
    generateOTP: jest.fn(),
    testConnection: jest.fn(),
  } as jest.Mocked<ExtensionLogic>;

  const appLogicMock = { disableDesktop: jest.fn() } as jest.Mocked<AppLogic>;

  const observableStoreConstructorMock = ObservableStore as jest.MockedClass<
    typeof ObservableStore
  >;

  let desktopController: DesktopController;

  beforeEach(() => {
    jest.resetAllMocks();

    observableStoreConstructorMock.mockReturnValue(storeMock);

    initDesktopControllerAppLogic(appLogicMock);
    initDesktopControllerExtensionLogic(extensionLogicMock);

    desktopController = new DesktopController({ initState: {} });
  });

  describe('getDesktopEnabled', () => {
    it.each([true, false])('returns value matching state if %s', (value) => {
      storeMock.getState.mockReturnValueOnce({ desktopEnabled: value });
      expect(desktopController.getDesktopEnabled()).toBe(value);
    });
  });

  describe('setDesktopEnabled', () => {
    it.each([true, false])('updates store state if %s', (value) => {
      desktopController.setDesktopEnabled(value);

      expect(storeMock.updateState).toHaveBeenCalledTimes(1);
      expect(storeMock.updateState).toHaveBeenCalledWith({
        desktopEnabled: value,
      });
    });
  });

  describe('generateOTP', () => {
    it('returns OTP generated using extension pairing', () => {
      extensionLogicMock.generateOTP.mockReturnValue(OTP_MOCK);

      const result = desktopController.generateOtp();

      expect(result).toStrictEqual(OTP_MOCK);
    });
  });

  describe('testDesktopConnection', () => {
    it('returns result from desktop manager', async () => {
      extensionLogicMock.testConnection.mockResolvedValueOnce(
        TEST_CONNECTION_RESULT_MOCK,
      );

      const result = await desktopController.testDesktopConnection();

      expect(result).toStrictEqual(TEST_CONNECTION_RESULT_MOCK);
    });
  });

  describe('disableDesktop', () => {
    it('invokes method on app logic', async () => {
      await desktopController.disableDesktop();
      expect(appLogicMock.disableDesktop).toHaveBeenCalledTimes(1);
    });
  });
});
