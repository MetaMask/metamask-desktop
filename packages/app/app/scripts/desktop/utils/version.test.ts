import { createExtensionPlatformMock, VERSION_MOCK } from '../test/mocks';
import ExtensionPlatform from '../../platforms/extension';
import { getVersion } from './version';

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
    it('returns version from extension platform', async () => {
      process.env.PACKAGE_VERSION = '';
      extensionPlatformMock.getVersion.mockReturnValueOnce(VERSION_MOCK);
      expect(getVersion()).toStrictEqual(VERSION_MOCK);
    });
  });
});
