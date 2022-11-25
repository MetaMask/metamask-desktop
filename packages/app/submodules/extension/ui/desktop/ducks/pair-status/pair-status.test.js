import pairStatusReducer, {
  initialPairStatusState,
  UPDATE_PAIR_STATUS,
  UPDATE_SUCCESSFUL_PAIR_SEEN,
} from './pair-status';

describe('Pair Status State', () => {
  const initialState = initialPairStatusState;

  it('pair status init state', () => {
    const initState = pairStatusReducer(initialState, {});
    expect.anything(initState);
  });

  it('updates pair status', () => {
    const state = pairStatusReducer(initialState, {
      type: UPDATE_PAIR_STATUS,
      payload: {
        isDesktopEnabled: false,
        isWebSocketConnected: true,
        connections: ['testConnection', 'testConnection2'],
      },
    });

    expect(state.isDesktopEnabled).toBe(false);
    expect(state.isWebSocketConnected).toBe(true);
    expect(state.connections).toStrictEqual([
      'testConnection',
      'testConnection2',
    ]);
  });

  it('should update successful pair seen state', () => {
    const successfulPairSeenState = {
      ...initialState,
      isSuccessfulPairSeen: true,
      isDesktopEnabled: true,
    };
    const state = pairStatusReducer(successfulPairSeenState, {
      type: UPDATE_PAIR_STATUS,
      payload: {
        isDesktopEnabled: false,
      },
    });
    expect(state.isSuccessfulPairSeen).toBe(false);
  });

  it('updates last activation if just connected', () => {
    jest.useFakeTimers('modern').setSystemTime(1000);
    const state = pairStatusReducer(initialState, {
      type: UPDATE_PAIR_STATUS,
      payload: {
        isWebSocketConnected: true,
      },
    });
    expect(state.lastActivation).toBe(1000);
  });

  it('updates successful pair seen', () => {
    const state = pairStatusReducer(initialState, {
      type: UPDATE_SUCCESSFUL_PAIR_SEEN,
    });
    expect(state.isSuccessfulPairSeen).toBe(true);
  });
});
