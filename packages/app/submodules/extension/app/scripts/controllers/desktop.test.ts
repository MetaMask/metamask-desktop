import { ObservableStore } from '@metamask/obs-store';
import {
  createExtensionConnectionMock,
  createObservableStoreMock,
  OTP_MOCK,
  TEST_CONNECTION_RESULT_MOCK,
} from '../../../../../test/mocks';
import { ExtensionPairing } from '../../../../../src/shared/pairing';
import DesktopManager from '../../../../../src/extension/desktop-manager';
import DesktopApp from '../../../../../src/app/desktop-app';
import DesktopController from './desktop';

jest.mock('@metamask/obs-store');

jest.mock(
  '../../../../../src/app/desktop-app',
  () => ({ getConnection: jest.fn() }),
  {
    virtual: true,
  },
);

jest.mock(
  '../../../../../src/extension/desktop-manager',
  () => ({ testConnection: jest.fn() }),
  { virtual: true },
);

jest.mock('../../../../../src/shared/pairing', () => ({
  ExtensionPairing: {
    generateOTP: jest.fn(),
  },
}));

describe('Desktop Controller', () => {
  const storeMock = createObservableStoreMock();
  const extensionPairingMock = ExtensionPairing as any;
  const extensionConnectionMock = createExtensionConnectionMock();

  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const desktopAppMock = DesktopApp as jest.Mocked<typeof DesktopApp>;

  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const desktopManagerMock = DesktopManager as jest.Mocked<
    typeof DesktopManager
  >;

  const observableStoreConstructorMock = ObservableStore as jest.MockedClass<
    typeof ObservableStore
  >;

  let desktopController: DesktopController;

  beforeEach(() => {
    jest.resetAllMocks();

    observableStoreConstructorMock.mockReturnValue(storeMock);

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
      extensionPairingMock.generateOTP.mockReturnValue(OTP_MOCK);

      const result = desktopController.generateOtp();

      expect(result).toStrictEqual(OTP_MOCK);
    });
  });

  describe('testDesktopConnection', () => {
    it('returns result from desktop manager', async () => {
      desktopManagerMock.testConnection.mockResolvedValueOnce(
        TEST_CONNECTION_RESULT_MOCK,
      );

      const result = await desktopController.testDesktopConnection();

      expect(result).toStrictEqual(TEST_CONNECTION_RESULT_MOCK);
    });
  });

  describe('disableDesktop', () => {
    it('invokes disable on desktop app connection', async () => {
      desktopAppMock.getConnection.mockReturnValueOnce(extensionConnectionMock);

      await desktopController.disableDesktop();

      expect(extensionConnectionMock.disable).toHaveBeenCalledTimes(1);
    });
  });
});