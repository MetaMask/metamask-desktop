import { createExtensionConnectionMock } from '../../test/mocks';
import desktopApp from './desktop-app';
import { AppDesktopController } from './controller-init';

jest.mock('./desktop-app');

describe('App Desktop Controller', () => {
  const desktopAppMock = desktopApp as jest.Mocked<typeof desktopApp>;
  const extensionConnectionMock = createExtensionConnectionMock();

  let desktopController: AppDesktopController;

  beforeEach(() => {
    jest.resetAllMocks();

    desktopController = new AppDesktopController({
      initState: {},
    });
  });

  describe('disableDesktop', () => {
    it('invokes function on app connection', () => {
      desktopAppMock.getConnection.mockReturnValueOnce(extensionConnectionMock);

      desktopController.disableDesktop();

      expect(extensionConnectionMock.disable).toHaveBeenCalledTimes(1);
    });
  });
});
