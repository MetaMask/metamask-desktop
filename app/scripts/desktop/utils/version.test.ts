import {
  createExtensionPlatformMock,
  VERSION_2_MOCK,
  VERSION_MOCK,
} from '../test/mocks';
import ExtensionPlatform from '../../platforms/extension';
import { getVersion } from './version';
import cfg from './config';

jest.mock('../../platforms/extension');

describe('Version Utils', () => {
  const extensionPlatformMock = createExtensionPlatformMock();

  const extensionPlatformConstructorMock =
    ExtensionPlatform as jest.MockedClass<typeof ExtensionPlatform>;

  beforeEach(() => {
    jest.resetAllMocks();
    extensionPlatformConstructorMock.mockReturnValue(extensionPlatformMock);
  });

  describe('getVersion', () => {
    it('returns version from extension platform if in extension', async () => {
      extensionPlatformMock.getVersion.mockReturnValueOnce(VERSION_MOCK);
      expect(getVersion()).toStrictEqual(VERSION_MOCK);
    });

    it('returns manifest version if in desktop', async () => {
      cfg().desktop.isApp = true;
      process.env.PACKAGE_VERSION = VERSION_2_MOCK;

      expect(getVersion()).toStrictEqual(`${VERSION_2_MOCK}-desktop.0`);
    });
  });
});
