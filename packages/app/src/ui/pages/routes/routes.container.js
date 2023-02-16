import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';

import { getTheme } from '../../ducks/app/app';
import {
  getFirstPermissionRequest,
  getFirstSnapInstallOrUpdateRequest,
  getUnapprovedTemplatedConfirmations,
  unconfirmedTransactionsCountSelector,
} from '../../../../submodules/extension/ui/selectors';
import Routes from './routes.component';

function getPermissionRequestId(state) {
  const permissionRequest = getFirstPermissionRequest(state);
  let permissionRequestId = permissionRequest?.metadata?.id;

  if (!permissionRequestId) {
    const snapRequest = getFirstSnapInstallOrUpdateRequest(state);
    permissionRequestId = snapRequest?.metadata?.id;
  }

  return permissionRequestId;
}

function mapStateToProps(state) {
  const stateLoaded = state.metamask.desktopEnabled;

  const permissionRequestId = stateLoaded
    ? getPermissionRequestId(state)
    : undefined;

  return {
    theme: getTheme(state),
    hasPendingApproval:
      stateLoaded && getUnapprovedTemplatedConfirmations(state).length > 0,
    hasPendingPermissionApproval: Boolean(permissionRequestId),
    hasPendingTransactionApproval:
      stateLoaded && unconfirmedTransactionsCountSelector(state) > 0,
    permissionRequestId,
  };
}

export default compose(withRouter, connect(mapStateToProps))(Routes);
