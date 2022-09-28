import React, { Component } from 'react';

import PropTypes from 'prop-types';
import { generate } from '../../../shared/modules/totp';

import Button from '../../components/ui/button';
import { MINUTE, SECOND } from '../../../shared/constants/time';
import Typography from '../../components/ui/typography';
import {
  TEXT_ALIGN,
  TYPOGRAPHY,
  JUSTIFY_CONTENT,
  FONT_WEIGHT,
  ALIGN_ITEMS,
} from '../../helpers/constants/design-system';

const PASSWORD_PROMPT_SCREEN = 'PASSWORD_PROMPT_SCREEN';
const KEYS_GENERATION_TIME = SECOND * 30;
const IDLE_TIME = MINUTE * 2;

export default class DesktopSyncPage extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    history: PropTypes.object.isRequired,
    selectedAddress: PropTypes.string.isRequired,
    displayWarning: PropTypes.func.isRequired,
    fetchInfoToSync: PropTypes.func.isRequired,
    mostRecentOverviewPage: PropTypes.string.isRequired,
    requestRevealSeedWords: PropTypes.func.isRequired,
    exportAccounts: PropTypes.func.isRequired,
    keyrings: PropTypes.array,
    hideWarning: PropTypes.func.isRequired,
  };

  state = {
    screen: PASSWORD_PROMPT_SCREEN,
    password: '',
    seedWords: null,
    importedAccounts: [],
    error: null,
    syncing: false,
    completed: false,
    channelName: undefined,
    cipherKey: undefined,
  };

  syncing = false;

  componentDidMount() {
    const desktopOtpBox = document.getElementById('desktop-otp-box');
    if (desktopOtpBox) {
      desktopOtpBox.focus();
    }
  }

 

  goBack() {
    const { history, mostRecentOverviewPage } = this.props;
    history.push(mostRecentOverviewPage);
  }

  
  componentWillUnmount() {
    if (this.state.error) {
      this.props.hideWarning();
    }
    // this.clearTimeouts();
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

  generateOtpCode() {
    const otpCode = generate();
    return otpCode;
  }

  renderContent() {
    const { syncing, completed, screen } = this.state;
    const { t } = this.context;

    return (
      <div>
        <Typography
          variant={TYPOGRAPHY.H2}
          align={TEXT_ALIGN.CENTER}
          fontWeight={FONT_WEIGHT.BOLD}
        >
          {this.generateOtpCode()}
        </Typography>
      </div>
      // <div className="view-quote__countdown-timer-container">
      //   <CountdownTimer
      //     timeStarted={quotesLastFetched}
      //     warningTime="0:30"
      //     labelKey="desktopNewQuoteIn"
      //   />
      // </div>
    );
  }

  renderFooter() {
    const { t } = this.context;
    const { password } = this.state;

    return (
      <div
        className="new-account-import-form__buttons"
        style={{ padding: '30px 15px 30px 15px', marginTop: 0 }}
      >
        <Button type="primary" rounded onClick={() => this.goBack()}>
          {t('done')}
        </Button>
      </div>
    );
  }

  render() {
    const { t } = this.context;
    const { screen } = this.state;

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
