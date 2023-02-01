import AppNavigation from './app-navigation';

jest.mock(
  'electron',
  () => ({
    app: {
      name: 'test',
      quit: jest.fn(),
      dock: {
        setMenu: jest.fn(),
      },
    },
    Tray: () => ({
      on: jest.fn(),
      setContextMenu: jest.fn(),
      setToolTip: jest.fn(),
    }),
    Menu: {
      buildFromTemplate: jest.fn(),
      setApplicationMenu: jest.fn(),
    },
    shell: {
      openExternal: jest.fn(),
    },
  }),
  {
    virtual: true,
  },
);

describe('App Navigation', () => {
  it('returns instance', () => {
    const appNavigation = new AppNavigation();
    expect(appNavigation).toBeDefined();
  });
});
