import { connect } from 'react-redux';
import {
  generateOtp,
  hideLoadingIndication,
  showLoadingIndication,
  hideWarning,
} from '../../store/actions';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
import { getWarningState } from '../../ducks/app/app';
import DesktopPairingPage from './desktop-pairing.component';

const mapDispatchToProps = (dispatch) => {
  return {
    generateOtp: () => generateOtp(),
    showLoadingIndication: () => dispatch(showLoadingIndication()),
    hideLoadingIndication: () => dispatch(hideLoadingIndication()),
    hideWarning: () => dispatch(hideWarning()),
  };
};

const mapStateToProps = (state) => {
  return {
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
    shouldShowWarning: getWarningState(state),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(DesktopPairingPage);
