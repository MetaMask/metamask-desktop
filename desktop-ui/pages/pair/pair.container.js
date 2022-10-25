import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
import Pair from './pair.component';

function mapStateToProps(state) {
  return {
    isPaired: state.pairStatus.isPaired,
  };
}

export default compose(withRouter, connect(mapStateToProps))(Pair);
