import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';

import {
  getIsSuccessfulPairSeen,
  getIsDesktopEnabled,
} from '../../ducks/pair-status/pair-status';
import Pair from './pair.component';

function mapStateToProps(state) {
  return {
    isDesktopEnabled: getIsDesktopEnabled(state),
    isSuccessfulPairSeen: getIsSuccessfulPairSeen(state),
  };
}

export default compose(withRouter, connect(mapStateToProps))(Pair);
