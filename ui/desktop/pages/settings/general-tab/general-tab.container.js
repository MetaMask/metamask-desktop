import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';

import {
  updateLanguage,
  updateTheme,
  getTheme,
  getLanguage,
} from '../../../ducks/app/app';
import {
  getLastActivation,
  getIsWebSocketConnected,
} from '../../../ducks/pair-status/pair-status';
import GeneralTab from './general-tab.component';

function mapStateToProps(state) {
  return {
    isWebSocketConnected: getIsWebSocketConnected(state),
    lastActivation: getLastActivation(state),
    language: getLanguage(state),
    theme: getTheme(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    updateCurrentLanguage: (newLocale) => dispatch(updateLanguage(newLocale)),
    updateTheme: (newTheme) => dispatch(updateTheme(newTheme)),
  };
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(GeneralTab);
