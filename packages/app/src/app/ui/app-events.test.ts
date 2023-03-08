import { app } from 'electron';
import { mockFilteredNodeEvent } from '../../../test/utils';
import AppEvents from './app-events';

jest.mock(
  'electron',
  () => ({
    app: {
      quit: jest.fn(),
      on: jest.fn(),
      exit: jest.fn(),
      setLoginItemSettings: jest.fn(),
      dock: {
        hide: jest.fn(),
      },
    },
    globalShortcut: {
      register: jest.fn(),
    },
  }),
  {
    virtual: true,
  },
);

describe('App Events', () => {
  const electronAppMock = app as jest.Mocked<any>;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns instance', () => {
    const appEvents = new AppEvents();
    expect(appEvents).toBeDefined();
  });

  it('should focus current open window when second instance open', () => {
    const appEvents = new AppEvents();
    mockFilteredNodeEvent(electronAppMock, 'on', 'second-instance');
    const spyOnShowAndFocusMainWindow = jest.spyOn(
      appEvents.appNavigation,
      'showAndFocusMainWindow',
    );

    appEvents.register();
    expect(spyOnShowAndFocusMainWindow).toHaveBeenCalled();
  });

  it('should focus current open window when activate event triggered', () => {
    const appEvents = new AppEvents();
    mockFilteredNodeEvent(electronAppMock, 'on', 'activate');
    const spyOnShowAndFocusMainWindow = jest.spyOn(
      appEvents.appNavigation,
      'showAndFocusMainWindow',
    );

    appEvents.register();
    expect(spyOnShowAndFocusMainWindow).toHaveBeenCalled();
  });

  it('should focus current open window and send url request to UI when custom protocol is requested', () => {
    const appEvents = new AppEvents();
    const mockMainWindowUrlAction = jest.fn();
    appEvents.UIState.mainWindow = {
      show: jest.fn(),
      focus: jest.fn(),
      on: jest.fn(),
      // eslint-disable-next-line
      // @ts-ignore
      webContents: {
        send: mockMainWindowUrlAction,
      },
    };
    mockFilteredNodeEvent(electronAppMock, 'on', 'open-url');
    const spyOnShowAndFocusMainWindow = jest.spyOn(
      appEvents.appNavigation,
      'showAndFocusMainWindow',
    );

    appEvents.register();
    expect(spyOnShowAndFocusMainWindow).toHaveBeenCalled();
    expect(mockMainWindowUrlAction).toHaveBeenCalled();
  });

  it('should set forceQuit property before quit event', () => {
    const appEvents = new AppEvents();
    mockFilteredNodeEvent(electronAppMock, 'on', 'before-quit');
    appEvents.register();

    expect(appEvents.UIState.forceQuit).toBe(true);
  });

  it('should hide main window when window close event triggered', () => {
    const appEvents = new AppEvents();
    const mockMainWindowHideAction = jest.fn();
    const eventMock = {
      preventDefault: jest.fn(),
    };
    appEvents.UIState = {
      forceQuit: false,
      mainWindow: {
        hide: mockMainWindowHideAction,
        // eslint-disable-next-line
        // @ts-ignore
        on: (eventName: string, callback: any) => {
          if (eventName === 'close') {
            callback(eventMock);
          }
        },
      },
    };

    appEvents.register();
    expect(mockMainWindowHideAction).toHaveBeenCalled();
  });

  it('should shut down application when window close event triggered from menu items', () => {
    const appEvents = new AppEvents();
    const mockMainWindowHideAction = jest.fn();
    appEvents.UIState = {
      forceQuit: true,
      mainWindow: {
        hide: mockMainWindowHideAction,
        // eslint-disable-next-line
        // @ts-ignore
        on: (eventName: string, callback: any) => {
          if (eventName === 'close') {
            callback();
          }
        },
      },
    };

    appEvents.register();
    expect(mockMainWindowHideAction).not.toHaveBeenCalled();
  });
});
