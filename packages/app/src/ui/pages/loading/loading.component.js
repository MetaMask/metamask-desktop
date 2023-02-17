import React, { useEffect } from 'react';
import LoadingScreen from '../../../../submodules/extension/ui/components/ui/loading-screen';

const Loading = ({
  isNotification,
  totalUnapprovedCount,
  isSigningQRHardwareTransaction,
  closeNotificationPopup
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
    if (shouldCloseNotificationPopup({
      isNotification,
      totalUnapprovedCount,
      isSigningQRHardwareTransaction
    })) {
      closeNotificationPopup();
    }
  }, [
    isNotification,
    totalUnapprovedCount,
    isSigningQRHardwareTransaction,
  ])


  return <LoadingScreen showLoadingSpinner />;
};

Loading.propTypes = {};

export default Loading;
