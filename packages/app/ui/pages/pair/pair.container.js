import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';

import {
  getIsSuccessfulPairSeen,
  getIsDesktopPaired,
} from '../../ducks/pair-status/pair-status';
import Pair from './pair.component';

function mapStateToProps(state) {
  return {
    isDesktopPaired: getIsDesktopPaired(state),
    isSuccessfulPairSeen: getIsSuccessfulPairSeen(state),
  };
}

export default compose(withRouter, connect(mapStateToProps))(Pair);
