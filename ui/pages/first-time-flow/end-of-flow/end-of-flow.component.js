import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../components/ui/button';
import Snackbar from '../../../components/ui/snackbar';
import MetaFoxLogo from '../../../components/ui/metafox-logo';
import { SUPPORT_REQUEST_LINK } from '../../../helpers/constants/common';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { returnToOnboardingInitiatorTab } from '../onboarding-initiator-util';
import {
  EVENT,
  EVENT_NAMES,
  CONTEXT_PROPS,
} from '../../../../shared/constants/metametrics';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';

export default class EndOfFlowScreen extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
    setOnBoardedInThisUISession: PropTypes.func,
  };

  static propTypes = {
    history: PropTypes.object,
    setCompletedOnboarding: PropTypes.func,
    onboardingInitiator: PropTypes.exact({
      location: PropTypes.string,
      tabId: PropTypes.number,
    }),
    setOnBoardedInThisUISession: PropTypes.func,
  };

  async _beforeUnload() {
    await this._onOnboardingComplete();
  }

  _removeBeforeUnload() {
    window.removeEventListener('beforeunload', this._beforeUnload);
  }

  async _onOnboardingComplete() {
    const { setCompletedOnboarding, setOnBoardedInThisUISession } = this.props;
    setOnBoardedInThisUISession(true);
    await setCompletedOnboarding();
  }

  onComplete = async () => {
    const { history, onboardingInitiator } = this.props;

    this._removeBeforeUnload();
    await this._onOnboardingComplete();
    if (onboardingInitiator) {
      await returnToOnboardingInitiatorTab(onboardingInitiator);
    }
    history.push(DEFAULT_ROUTE);
  };

  componentDidMount() {
    window.addEventListener('beforeunload', this._beforeUnload.bind(this));
  }

  componentWillUnmount = () => {
    this._removeBeforeUnload();
  };

  render() {
    const { t } = this.context;
    const { onboardingInitiator } = this.props;

    return (
      <div className="end-of-flow" data-testid="end-of-flow">
        <MetaFoxLogo />
        <div className="end-of-flow__emoji">🎉</div>
        <div className="first-time-flow__header">{t('congratulations')}</div>
        <div className="first-time-flow__text-block end-of-flow__text-1">
          {t('endOfFlowMessage1')}
        </div>
        <div className="first-time-flow__text-block end-of-flow__text-2">
          {t('endOfFlowMessage2')}
        </div>
        <div className="end-of-flow__text-3">
          {`• ${t('endOfFlowMessage3')}`}
        </div>
        <div className="end-of-flow__text-3">
          {`• ${t('endOfFlowMessage4')}`}
        </div>
        <div className="end-of-flow__text-3">
          {`• ${t('endOfFlowMessage5')}`}
        </div>
        <div className="end-of-flow__text-3">
          {`• ${t('endOfFlowMessage6')}`}
        </div>
        <div className="end-of-flow__text-3">
          •{' '}
          {t('endOfFlowMessage7', [
            <a
              target="_blank"
              key="metamaskSupportLink"
              rel="noopener noreferrer"
              href={SUPPORT_REQUEST_LINK}
              onClick={() => {
                this.context.trackEvent(
                  {
                    category: EVENT.CATEGORIES.ONBOARDING,
                    event: EVENT_NAMES.SUPPORT_LINK_CLICKED,
                    properties: {
                      url: SUPPORT_REQUEST_LINK,
                    },
                  },
                  {
                    contextPropsIntoEventProperties: [CONTEXT_PROPS.PAGE_TITLE],
                  },
                );
              }}
            >
              <span className="first-time-flow__link-text">
                {this.context.t('here')}
              </span>
            </a>,
          ])}
        </div>
        <div className="first-time-flow__text-block end-of-flow__text-4">
          {`*${t('endOfFlowMessage8')}`}&nbsp;
          <a
            href={ZENDESK_URLS.BASIC_SAFETY}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="first-time-flow__link-text">
              {t('endOfFlowMessage9')}
            </span>
          </a>
        </div>
        <Button
          type="primary"
          className="first-time-flow__button"
          onClick={this.onComplete}
          data-testid="EOF-complete-button"
        >
          {t('endOfFlowMessage10')}
        </Button>
        {onboardingInitiator ? (
          <Snackbar
            content={t('onboardingReturnNotice', [
              t('endOfFlowMessage10'),
              onboardingInitiator.location,
            ])}
          />
        ) : null}
      </div>
    );
  }
}
