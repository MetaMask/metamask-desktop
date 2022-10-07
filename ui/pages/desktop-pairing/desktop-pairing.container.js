import { connect } from 'react-redux';
import { setOtpPairing, setIsPairing, generateOtp } from '../../store/actions';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
import { getIsPairing, getDesktopPairingOtp } from '../../selectors/selectors';
import DesktopPairingPage from './desktop-pairing.component';

const mapDispatchToProps = (dispatch) => {
  return {
    setOtpPairing: () => dispatch(setOtpPairing()),
    setIsPairing: (val) => dispatch(setIsPairing(val)),
    generateOtp: () => dispatch(generateOtp()),
  };
};

const mapStateToProps = (state) => {
  const {
    metamask: { selectedAddress },
  } = state;

  return {
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
    selectedAddress,
    isPairing: getIsPairing(state),
    otpState: getDesktopPairingOtp(state),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(DesktopPairingPage);
