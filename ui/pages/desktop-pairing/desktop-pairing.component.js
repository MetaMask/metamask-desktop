import React, { Component } from 'react';

import PropTypes from 'prop-types';
import { generate } from '../../../shared/modules/totp';

import Button from '../../components/ui/button';
import { SECOND } from '../../../shared/constants/time';
import Typography from '../../components/ui/typography';
import {
  TEXT_ALIGN,
  TYPOGRAPHY,
  FONT_WEIGHT,
} from '../../helpers/constants/design-system';
// import CountdownTimer from '../swaps/countdown-timer/countdown-timer';

const OTP_GENERATION_TIME = SECOND * 30;

export default class DesktopPairingPage extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    history: PropTypes.object.isRequired,
    setIsPairing: PropTypes.func.isRequired,
    isPairing: PropTypes.bool.isRequired,
    mostRecentOverviewPage: PropTypes.string.isRequired,
    generateOtp: PropTypes.func,
    otpState: PropTypes.string,
  };

  componentDidMount() {
    this.interval = setInterval(
      () => this.props.generateOtp(),
      OTP_GENERATION_TIME,
    );
  }

  goBack() {
    const { history, mostRecentOverviewPage } = this.props;
    history.push(mostRecentOverviewPage);
  }

  componentWillUnmount() {
    if (this.props.isPairing) {
      this.props.setIsPairing(false);
    }
    clearInterval(this.interval);
  }

  renderWarning(text) {
    return (
      <div className="page-container__warning-container">
        <div className="page-container__warning-message">
          <div>{text}</div>
        </div>
      </div>
    );
  }

  generateOTPCode() {
    return generate();
  }

  renderContent() {
    return (
      <div>
        <Typography
          variant={TYPOGRAPHY.H2}
          align={TEXT_ALIGN.CENTER}
          fontWeight={FONT_WEIGHT.BOLD}
        >
          {this.props.otpState}
        </Typography>
        {/* <div className="view-quote__countdown-timer-container">
          <CountdownTimer
            timerBase={OTP_GENERATION_TIME}
            // timeStarted={OTP_GENERATION_TIME}
            labelKey="New quotes in $1"
          />
        </div> */}
      </div>
    );
  }

  renderFooter() {
    const { t } = this.context;
    return (
      <div
        className="new-account-import-form__buttons"
        style={{ padding: '30px 15px 30px 15px', marginTop: 0 }}
      >
        <Button
          type="primary"
          rounded
          value={this.props.isPairing}
          onClick={(value) => {
            this.goBack();
            this.props.setIsPairing(!value);
          }}
        >
          {t('done')}
        </Button>
      </div>
    );
  }

  render() {
    return (
      <div className="page-container">
        <div className="page-container__header">
          <div className="page-container__title">Sync with Desktop</div>
          <div className="page-container__subtitle">
            Open your MetaMask Desktop and type this code
          </div>
        </div>
        <div className="page-container__content">{this.renderContent()}</div>
        {this.renderFooter()}
      </div>
    );
  }
}
