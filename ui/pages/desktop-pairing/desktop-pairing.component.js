import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from '../../components/ui/button';
import { SECOND } from '../../../shared/constants/time';
import Typography from '../../components/ui/typography';
import {
  TEXT_ALIGN,
  TYPOGRAPHY,
  FONT_WEIGHT,
} from '../../helpers/constants/design-system';

const OTP_DURATION = SECOND * 30;
const REFRESH_INTERVAL = SECOND;

export default class DesktopPairingPage extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    history: PropTypes.object.isRequired,
    mostRecentOverviewPage: PropTypes.string.isRequired,
    showLoadingIndication: PropTypes.func,
    hideLoadingIndication: PropTypes.func,
    generateOtp: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this.generate();
    this.updateCurrentTime();

    this.generateInterval = setInterval(() => this.generate(), OTP_DURATION);
    this.refreshinterval = setInterval(
      () => this.updateCurrentTime(),
      REFRESH_INTERVAL,
    );
  }

  componentWillUnmount() {
    clearInterval(this.generateInterval);
    clearInterval(this.refreshinterval);
  }

  async generate() {
    const { generateOtp } = this.props;

    const otp = await generateOtp();
    const lastOtpTime = new Date().getTime();

    this.setState({ otp, lastOtpTime });
  }

  updateCurrentTime() {
    const currentTime = new Date().getTime();
    this.setState({ currentTime });
  }

  getExpireDuration() {
    const { currentTime, lastOtpTime } = this.state;

    const timeSinceOtp = currentTime - lastOtpTime;
    const expireDurationMilliseconds = OTP_DURATION - timeSinceOtp;

    const expireDurationSeconds = Math.round(
      expireDurationMilliseconds / SECOND,
    );

    return expireDurationSeconds;
  }

  goBack() {
    const { history, mostRecentOverviewPage } = this.props;
    history.push(mostRecentOverviewPage);
  }

  renderContent() {
    const { showLoadingIndication, hideLoadingIndication } = this.props;
    const { otp } = this.state;

    if (!otp) {
      showLoadingIndication();
      return null;
    }

    hideLoadingIndication();

    return (
      <div>
        <Typography
          variant={TYPOGRAPHY.H2}
          align={TEXT_ALIGN.CENTER}
          fontWeight={FONT_WEIGHT.BOLD}
        >
          {otp}
        </Typography>
        <Typography variant={TYPOGRAPHY.H4} align={TEXT_ALIGN.CENTER}>
          Expires in {this.getExpireDuration()} seconds
        </Typography>
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
          onClick={() => {
            this.goBack();
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
