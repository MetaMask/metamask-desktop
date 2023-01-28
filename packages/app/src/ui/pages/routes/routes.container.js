import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';

import { getTheme } from '../../ducks/app/app';
import {
  getFirstPermissionRequestId,
  getUnapprovedTemplatedConfirmations,
  unconfirmedTransactionsCountSelector,
} from '../../selectors';
import Routes from './routes.component';

function mapStateToProps(state) {
  const stateLoaded = state.metamask.desktopEnabled;

  return {
    theme: getTheme(state),
    pendingApprovals: stateLoaded
      ? getUnapprovedTemplatedConfirmations(state)
      : [],
    firstPermissionsRequestId: stateLoaded
      ? getFirstPermissionRequestId(state)
      : undefined,
    unconfirmedTransactionsCount: stateLoaded
      ? unconfirmedTransactionsCountSelector(state)
      : 0,
  };
}

export default compose(withRouter, connect(mapStateToProps))(Routes);
