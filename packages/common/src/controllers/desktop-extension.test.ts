import { Pairing } from '../pairing';
import { OTP_MOCK, TEST_CONNECTION_RESULT_MOCK } from '../../test/mocks';
import desktopManager from '../desktop-manager';
import { ExtensionDesktopController } from './desktop-extension';

jest.mock('@metamask/obs-store');
jest.mock('../pairing');
jest.mock('../desktop-manager');

describe('Extension Desktop Controller', () => {
  const pairingMock = Pairing as jest.Mocked<typeof Pairing>;
  const desktopManagerMock = desktopManager as jest.Mocked<
    typeof desktopManager
  >;

  let desktopController: ExtensionDesktopController;

  beforeEach(() => {
    jest.resetAllMocks();

    desktopController = new ExtensionDesktopController({
      initState: {},
    });
  });

  describe('generateOtp', () => {
    it('invokes pairing function', () => {
      pairingMock.generateOTP.mockReturnValue(OTP_MOCK);

      const result = desktopController.generateOtp();

      expect(result).toStrictEqual(OTP_MOCK);
    });
  });

  describe('testDesktopConnection', () => {
    it('invokes desktop manager function', async () => {
      desktopManagerMock.testConnection.mockResolvedValue(
        TEST_CONNECTION_RESULT_MOCK,
      );

      const result = await desktopController.testDesktopConnection();

      expect(result).toStrictEqual(TEST_CONNECTION_RESULT_MOCK);
    });
  });
});
