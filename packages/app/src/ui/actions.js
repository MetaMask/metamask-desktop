import {
  setCurrentLocale,
  updateMetamaskState,
} from '../../submodules/extension/ui/store/actions';
import * as actionConstants from '../../submodules/extension/ui/store/actionConstants';
import { fetchLocale } from '../../submodules/extension/ui/helpers/utils/i18n-helper';

export function updateState(newState) {
  return async (dispatch, getState) => {
    const isFirstState = !getState().metamask.provider;

    if (isFirstState) {
      dispatch({
        type: actionConstants.UPDATE_METAMASK_STATE,
        value: newState,
      });

      const locale = newState.currentLocale;
      const localeMessages = await fetchLocale(locale);

      dispatch(setCurrentLocale(locale, localeMessages));
    } else {
      updateMetamaskState(newState)(dispatch, getState);
    }
  };
}
