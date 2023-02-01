export const initialPairStatusState = {
  isDesktopPaired: false,
  isWebSocketConnected: false,
  isSuccessfulPairSeen: false,
  connections: [],
  lastActivation: null,
};

// Actions
export const UPDATE_PAIR_STATUS = 'UPDATE_PAIR_STATUS';
export const UPDATE_SUCCESSFUL_PAIR_SEEN = 'UPDATE_SUCCESSFUL_PAIR_SEEN';

// Reducer
/**
 *
 * @param state
 * @param action
 */
export default function pairStatusReducer(
  state = initialPairStatusState,
  action,
) {
  switch (action.type) {
    case UPDATE_PAIR_STATUS: {
      const isActivated =
        state.isWebSocketConnected === false &&
        action.payload.isWebSocketConnected === true;
      const isUnpaired =
        state.isDesktopPaired === true &&
        action.payload.isDesktopPaired === false;
      const lastActivation = new Date().getTime();
      return {
        ...state,
        ...action.payload,
        ...(isActivated && { lastActivation }),
        ...(isUnpaired && { isSuccessfulPairSeen: false }),
      };
    }

    case UPDATE_SUCCESSFUL_PAIR_SEEN: {
      return {
        ...state,
        isSuccessfulPairSeen: true,
      };
    }
    default:
      return state;
  }
}

// Selectors
export const getLastActivation = (state) => state.pairStatus.lastActivation;
export const getIsDesktopPaired = (state) => state.pairStatus.isDesktopPaired;
export const getIsWebSocketConnected = (state) =>
  state.pairStatus.isWebSocketConnected;
export const getIsSuccessfulPairSeen = (state) =>
  state.pairStatus.isSuccessfulPairSeen;

// Action Creators
/**
 *
 * @param payload
 */
export function updatePairStatus(payload) {
  return { type: UPDATE_PAIR_STATUS, payload };
}

/**
 *
 */
export function updateSuccessfulPairSeen() {
  return { type: UPDATE_SUCCESSFUL_PAIR_SEEN };
}
