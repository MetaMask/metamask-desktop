import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
import ErrorPageComponent from './error.component';

export default compose(withRouter, connect())(ErrorPageComponent);
