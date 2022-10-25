export const initialPairStatusState = {
  isPaired: false,
  isWebSocketConnected: false,
  connections: [],
  lastActivation: null,
};

// Actions
export const UPDATE_PAIR_STATUS = 'UPDATE_PAIR_STATUS';

// Reducer
export default function pairStatusReducer(
  state = initialPairStatusState,
  action,
) {
  switch (action.type) {
    case UPDATE_PAIR_STATUS: {
      const isActivated =
        state.isPaired === false && action.payload.isPaired === true;
      const lastActivation = new Date().getTime();
      return {
        ...state,
        ...action.payload,
        ...(isActivated && { lastActivation }),
      };
    }
    default:
      return state;
  }
}

// Selectors
export const getLastActivation = (state) => state.pairStatus.lastActivation;
export const getIsPaired = (state) => state.pairStatus.isPaired;

// Action Creators
export function updatePairStatus(payload) {
  return { type: UPDATE_PAIR_STATUS, payload };
}
