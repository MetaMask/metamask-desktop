import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';

import MetametricsOptInComponent from './metametrics-opt-in.component';

export default compose(withRouter, connect())(MetametricsOptInComponent);
