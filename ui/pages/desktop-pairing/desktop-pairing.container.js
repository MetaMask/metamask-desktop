import { connect } from 'react-redux';
import {
  setIsPairing,
  generateOtp,
  hideLoadingIndication,
  showLoadingIndication,
} from '../../store/actions';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
import { getIsPairing } from '../../selectors/selectors';
import DesktopPairingPage from './desktop-pairing.component';

const mapDispatchToProps = (dispatch) => {
  return {
    setIsPairing: (val) => dispatch(setIsPairing(val)),
    generateOtp: () => generateOtp(),
    showLoadingIndication: () => dispatch(showLoadingIndication()),
    hideLoadingIndication: () => dispatch(hideLoadingIndication()),
  };
};

const mapStateToProps = (state) => {
  return {
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
    isPairing: getIsPairing(state),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(DesktopPairingPage);
