import { VERSION_MOCK } from '../../test/mocks';
import { getDesktopVersion } from './version';

describe('Version Utils', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('getDesktopVersion', () => {
    it('returns version from package version', async () => {
      process.env.PACKAGE_VERSION = VERSION_MOCK;
      expect(getDesktopVersion()).toBe(`${VERSION_MOCK}-desktop.0`);
    });
  });
});
