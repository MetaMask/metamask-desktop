import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';

import { getTheme } from '../../ducks/app/app';
import {
  getFirstPermissionRequest,
  getUnapprovedTemplatedConfirmations,
  unconfirmedTransactionsCountSelector,
} from '../../../submodules/extension/ui/selectors';
import Routes from './routes.component';

function mapStateToProps(state) {
  const stateLoaded = state.metamask.desktopEnabled;

  const permissionRequest = stateLoaded
    ? getFirstPermissionRequest(state)
    : null;

  return {
    theme: getTheme(state),
    hasPendingApproval:
      stateLoaded && getUnapprovedTemplatedConfirmations(state).length > 0,
    hasPendingPermissionApproval: stateLoaded && Boolean(permissionRequest),
    hasPendingTransactionApproval:
      stateLoaded && unconfirmedTransactionsCountSelector(state) > 0,
    permissionRequestId: permissionRequest?.metadata?.id,
  };
}

export default compose(withRouter, connect(mapStateToProps))(Routes);
