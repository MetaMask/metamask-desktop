import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';

import {
  getIsDesktopPaired,
  updateSuccessfulPairSeen,
} from '../../ducks/pair-status/pair-status';
import SuccessfulPair from './successful-pair.component';

function mapStateToProps(state) {
  return {
    isDesktopPaired: getIsDesktopPaired(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    updateSuccessfulPairSeen: () => dispatch(updateSuccessfulPairSeen()),
  };
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(SuccessfulPair);
