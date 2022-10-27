import pairStatusReducer, {
  initialPairStatusState,
  UPDATE_PAIR_STATUS,
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
        isPaired: false,
        isWebSocketConnected: true,
        connections: ['testConnection', 'testConnection2'],
      },
    });

    expect(state.isPaired).toBe(false);
    expect(state.isWebSocketConnected).toBe(true);
    expect(state.connections).toStrictEqual([
      'testConnection',
      'testConnection2',
    ]);
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
});
