import React, { useEffect } from 'react';
import { PropTypes } from 'prop-types';
import LoadingScreen from '../../../../submodules/extension/ui/components/ui/loading-screen';

const Loading = ({
  isNotification,
  totalUnapprovedCount,
  isSigningQRHardwareTransaction,
  closeNotificationPopup,
}) => {
  function shouldCloseNotificationPopup({
    isNotification,
    totalUnapprovedCount,
    isSigningQRHardwareTransaction,
  }) {
    return (
      isNotification &&
      totalUnapprovedCount === 0 &&
      !isSigningQRHardwareTransaction
    );
  }

  useEffect(() => {
    if (
      shouldCloseNotificationPopup({
        isNotification,
        totalUnapprovedCount,
        isSigningQRHardwareTransaction,
      })
    ) {
      closeNotificationPopup();
    }
  }, [isNotification, totalUnapprovedCount, isSigningQRHardwareTransaction]);

  return <LoadingScreen showLoadingSpinner />;
};

Loading.propTypes = {
  isNotification: PropTypes.bool,
  totalUnapprovedCount: PropTypes.number,
  isSigningQRHardwareTransaction: PropTypes.bool,
  closeNotificationPopup: PropTypes.func,
};

export default Loading;
