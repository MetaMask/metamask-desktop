import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
import Loading from './loading.component';

function mapStateToProps(_state) {
  return {};
}

export default compose(withRouter, connect(mapStateToProps))(Loading);
