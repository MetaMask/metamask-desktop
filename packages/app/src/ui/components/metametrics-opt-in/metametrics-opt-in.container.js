import { connect } from 'react-redux';
import { updateMetametricsOptIn } from '../../ducks/app/app';
import MetaMetricsOptIn from './metametrics-opt-in.component';

/**
 *
 */
function mapStateToProps() {
  return {};
}

function mapDispatchToProps(dispatch) {
  return {
    updateMetametricsOptIn: (newPref) =>
      dispatch(updateMetametricsOptIn(newPref)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(MetaMetricsOptIn);
