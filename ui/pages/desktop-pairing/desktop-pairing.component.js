import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from '../../components/ui/button';
import { SECOND } from '../../../shared/constants/time';
import Typography from '../../components/ui/typography';
import IconDesktopPairing from '../../components/ui/icon/icon-desktop-pairing';
import {
  TEXT_ALIGN,
  TYPOGRAPHY,
  DISPLAY,
  ALIGN_ITEMS,
  FLEX_DIRECTION,
} from '../../helpers/constants/design-system';
import Box from '../../components/ui/box/box';

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

  renderIcon() {
    return (
      <div>
        <Box
          display={DISPLAY.FLEX}
          alignItems={ALIGN_ITEMS.CENTER}
          textAlign={TEXT_ALIGN.CENTER}
          flexDirection={FLEX_DIRECTION.COLUMN}
          marginLeft={6}
          marginRight={6}
          marginTop={12}
        >
          <IconDesktopPairing size={64} />
        </Box>
      </div>
    );
  }

  renderContent() {
    const { showLoadingIndication, hideLoadingIndication } = this.props;
    const { otp } = this.state;

    if (!otp) {
      showLoadingIndication();
      return <div></div>;
    }

    hideLoadingIndication();

    return (
      <div>
        <Box
          display={DISPLAY.FLEX}
          alignItems={ALIGN_ITEMS.CENTER}
          textAlign={TEXT_ALIGN.CENTER}
          flexDirection={FLEX_DIRECTION.COLUMN}
          marginLeft={6}
          marginRight={6}
        >
          <Typography
            align={TEXT_ALIGN.CENTER}
            className="desktop-pairing__otp"
          >
            {otp}
          </Typography>
        </Box>

        <Typography
          variant={TYPOGRAPHY.Paragraph}
          align={TEXT_ALIGN.CENTER}
          className="desktop-pairing__countdown-timer"
        >
          Code expires in{' '}
          <span className="desktop-pairing__countdown-timer-seconds">
            {this.getExpireDuration()}
          </span>{' '}
          seconds
        </Typography>
      </div>
    );
  }

  renderFooter() {
    const { t } = this.context;
    return (
      <div className="desktop-pairing__buttons">
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
    const { t } = this.context;
    return (
      <div className="page-container__content">
        <div className="desktop-pairing">
          {this.renderIcon()}
          <div className="desktop-pairing__title">{t('desktopPageTitle')}</div>
          <div className="desktop-pairing__subtitle">
            {t('desktopPageSubTitle')}
          </div>
        </div>
        <div className="desktop-pairing">{this.renderContent()}</div>
        {this.renderFooter()}
      </div>
    );
  }
}
