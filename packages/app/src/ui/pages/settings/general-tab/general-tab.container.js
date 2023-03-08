import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';

import {
  updateLanguage,
  updateTheme,
  getTheme,
  getLanguage,
  getPreferredStartup,
  updatePreferredStartup,
  updateDesktopPopupEnabled,
  getDesktopPopupEnabled,
} from '../../../ducks/app/app';
import {
  getLastActivation,
  getIsWebSocketConnected,
  getIsDesktopPaired,
  getIsSuccessfulPairSeen,
} from '../../../ducks/pair-status/pair-status';
import GeneralTab from './general-tab.component';

function mapStateToProps(state) {
  return {
    isDesktopPaired: getIsDesktopPaired(state),
    isSuccessfulPairSeen: getIsSuccessfulPairSeen(state),
    isWebSocketConnected: getIsWebSocketConnected(state),
    lastActivation: getLastActivation(state),
    language: getLanguage(state),
    theme: getTheme(state),
    preferredStartup: getPreferredStartup(state),
    isDesktopPopupEnabled: getDesktopPopupEnabled(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    updateCurrentLanguage: (newLocale) => dispatch(updateLanguage(newLocale)),
    updateTheme: (newTheme) => dispatch(updateTheme(newTheme)),
    updatePreferredStartup: (openAtLogin) =>
      dispatch(updatePreferredStartup(openAtLogin)),
    updateDesktopPopupEnabled: (isEnabled) =>
      dispatch(updateDesktopPopupEnabled(isEnabled)),
  };
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(GeneralTab);
