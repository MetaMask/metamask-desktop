import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import {
  setUseCollectibleDetection,
  setOpenSeaEnabled,
  setEIP1559V2Enabled,
  setCustomNetworkListEnabled,
  setDesktopEnabled,
  setIsPairing,
  generateOtp,
} from '../../../store/actions';
import {
  getUseCollectibleDetection,
  getOpenSeaEnabled,
  getEIP1559V2Enabled,
  getIsCustomNetworkListEnabled,
  getIsDesktopEnabled,
  getIsPairing,
  getDesktopPairingOtp,
} from '../../../selectors';
import ExperimentalTab from './experimental-tab.component';

const mapStateToProps = (state) => {
  return {
    useCollectibleDetection: getUseCollectibleDetection(state),
    openSeaEnabled: getOpenSeaEnabled(state),
    eip1559V2Enabled: getEIP1559V2Enabled(state),
    customNetworkListEnabled: getIsCustomNetworkListEnabled(state),
    desktopEnabled: getIsDesktopEnabled(state),
    isPairing: getIsPairing(state),
    otp: getDesktopPairingOtp(state),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setUseCollectibleDetection: (val) =>
      dispatch(setUseCollectibleDetection(val)),
    setOpenSeaEnabled: (val) => dispatch(setOpenSeaEnabled(val)),
    setEIP1559V2Enabled: (val) => dispatch(setEIP1559V2Enabled(val)),
    setCustomNetworkListEnabled: (val) =>
      dispatch(setCustomNetworkListEnabled(val)),
    setDesktopEnabled: (val) => dispatch(setDesktopEnabled(val)),
    setIsPairing: (val) => dispatch(setIsPairing(val)),
    generateOtp: () => dispatch(generateOtp()),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(ExperimentalTab);
