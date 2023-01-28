import { updateMetamaskState } from '../submodules/extension/ui/store/actions';
import * as actionConstants from '../submodules/extension/ui/store/actionConstants';

export function updateState(newState) {
  return (dispatch, getState) => {
    // eslint-disable-next-line no-negated-condition
    if (!getState().metamask.provider) {
      dispatch({
        type: actionConstants.UPDATE_METAMASK_STATE,
        value: newState,
      });
    } else {
      updateMetamaskState(newState)(dispatch, getState);
    }
  };
}
