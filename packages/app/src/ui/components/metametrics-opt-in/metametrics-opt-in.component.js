import EventEmitter from 'events';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';

import { PAIR_ROUTE } from '../../../shared/constants/ui-routes';
import Mascot from '../mascot';
import Button from '../../../../submodules/extension/ui/components/ui/button';
import useI18nContext from '../../hooks/useI18nContext';

const MetaMetricsOptIn = ({ updateMetametricsOptIn }) => {
  const t = useI18nContext();
  const history = useHistory();
  const [eventEmitter] = useState(new EventEmitter());

  const handleLinkClick = (link) => (event) => {
    event.preventDefault();
    window.electronBridge.openExternalShell(link);
  };

  return (
    <div className="metametrics-opt-in">
      <div className="metametrics-opt-in__main">
        <Mascot
          animationEventEmitter={eventEmitter}
          width="100"
          height="100"
          followMouse={false}
        />
        <div className="metametrics-opt-in__title">
          {t('metametricsHelpImproveMetaMask')}
        </div>
        <div className="metametrics-opt-in__body">
          <div className="metametrics-opt-in__description">
            {t('metametricsOptInDescription')}
          </div>
          <div className="metametrics-opt-in__description">
            {t('metametricsCommitmentsIntro')}
          </div>

          <div className="metametrics-opt-in__committments">
            <div className="metametrics-opt-in__row">
              <i className="fa fa-check" />
              <div className="metametrics-opt-in__row-description">
                {t('metametricsCommitmentsAllowOptOut')}
              </div>
            </div>
            <div className="metametrics-opt-in__row">
              <i className="fa fa-check" />
              <div className="metametrics-opt-in__row-description">
                {t('metametricsCommitmentsSendAnonymizedEvents')}
              </div>
            </div>
            <div className="metametrics-opt-in__row metametrics-opt-in__break-row">
              <i className="fa fa-times" />
              <div className="metametrics-opt-in__row-description">
                {t('metametricsCommitmentsNeverCollectKeysEtc', [
                  <span
                    className="metametrics-opt-in__bold"
                    key="neverCollectKeys"
                  >
                    {t('metametricsCommitmentsBoldNever')}
                  </span>,
                ])}
              </div>
            </div>
            <div className="metametrics-opt-in__row">
              <i className="fa fa-times" />
              <div className="metametrics-opt-in__row-description">
                {t('metametricsCommitmentsNeverCollectIP', [
                  <span
                    className="metametrics-opt-in__bold"
                    key="neverCollectIP"
                  >
                    {t('metametricsCommitmentsBoldNever')}
                  </span>,
                ])}
              </div>
            </div>
            <div className="metametrics-opt-in__row">
              <i className="fa fa-times" />
              <div className="metametrics-opt-in__row-description">
                {t('metametricsCommitmentsNeverSellDataForProfit', [
                  <span
                    className="metametrics-opt-in__bold"
                    key="neverSellData"
                  >
                    {t('metametricsCommitmentsBoldNever')}
                  </span>,
                ])}
              </div>
            </div>
          </div>
        </div>
        <div className="metametrics-opt-in__buttons">
          <Button
            type="secondary"
            onClick={() => {
              updateMetametricsOptIn(false);
              history.push(PAIR_ROUTE);
            }}
          >
            {t('noThanks')}
          </Button>
          <Button
            type="primary"
            onClick={() => {
              updateMetametricsOptIn(true);
              history.push(PAIR_ROUTE);
            }}
          >
            {t('agree')}
          </Button>
        </div>
        <div className="metametrics-opt-in__footer">
          <div className="metametrics-opt-in__bottom-text">
            {t('metricsSharingStrategy')}
          </div>
          <div className="metametrics-opt-in__bottom-text">
            {t('gdprMessage', [
              <a
                key="metametrics-bottom-text-wrapper"
                href="https://metamask.io/privacy.html"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleLinkClick('https://metamask.io/privacy.html')}
              >
                {t('gdprMessagePrivacyPolicy')}
              </a>,
            ])}
          </div>
        </div>
      </div>
    </div>
  );
};

MetaMetricsOptIn.propTypes = {
  /**
   * Updates the user's metametrics opt in preference
   */
  updateMetametricsOptIn: PropTypes.func,
};

export default MetaMetricsOptIn;
