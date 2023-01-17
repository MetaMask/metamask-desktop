import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';

import {
  updateLanguage,
  updateTheme,
  getTheme,
  getLanguage,
  getOpenAtLogin,
  updateOpenAtLogin,
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
    openAtLogin: getOpenAtLogin(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    updateCurrentLanguage: (newLocale) => dispatch(updateLanguage(newLocale)),
    updateTheme: (newTheme) => dispatch(updateTheme(newTheme)),
    updateOpenAtLogin: (openAtLogin) => dispatch(updateOpenAtLogin(openAtLogin)),
  };
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(GeneralTab);
