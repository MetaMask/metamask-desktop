import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';

import {
  getMetametricsOptIn,
  updateMetametricsOptIn,
} from '../../../ducks/app/app';
import PrivacyTab from './privacy-tab.component';

function mapStateToProps(state) {
  return {
    metametricsOptIn: getMetametricsOptIn(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    updateMetametricsOptIn: (newPreference) =>
      dispatch(updateMetametricsOptIn(newPreference)),
  };
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(PrivacyTab);
