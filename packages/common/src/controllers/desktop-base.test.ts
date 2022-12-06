import { ObservableStore } from '@metamask/obs-store';
import { createObservableStoreMock } from '../../test/mocks';
import { DesktopController } from './desktop-base';

jest.mock('@metamask/obs-store');

describe('Base Desktop Controller', () => {
  const storeMock = createObservableStoreMock();

  const observableStoreConstructorMock = ObservableStore as jest.MockedClass<
    typeof ObservableStore
  >;

  let desktopController: DesktopController;

  beforeEach(() => {
    jest.resetAllMocks();

    observableStoreConstructorMock.mockReturnValue(storeMock);

    desktopController = new (class extends DesktopController {})({
      initState: {},
    });
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
});
