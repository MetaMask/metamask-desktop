import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
import Loading from './loading.component';
import {
  getTotalUnapprovedCount,
  hasUnsignedQRHardwareTransaction,
  hasUnsignedQRHardwareMessage
} from '../../../../submodules/extension/ui/selectors'
import { closeNotificationPopup } from '../../../../submodules/extension/ui/store/actions'

function mapStateToProps(state) {
  const totalUnapprovedCount = getTotalUnapprovedCount(state);
  const isSigningQRHardwareTransaction =
    hasUnsignedQRHardwareTransaction(state) ||
    hasUnsignedQRHardwareMessage(state);

  return {
    isNotification: true,
    totalUnapprovedCount,
    isSigningQRHardwareTransaction
  };
}

function mapDispatchToProps() {
  return {
    closeNotificationPopup: () => closeNotificationPopup(),
  };
}

export default compose(withRouter, connect(mapStateToProps, mapDispatchToProps))(Loading);
