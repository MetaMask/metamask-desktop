import React, { useState, useEffect, useRef, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';
import Button from '../../components/ui/button';
import { SECOND } from '../../../shared/constants/time';
import Typography from '../../components/ui/typography';
import { I18nContext } from '../../contexts/i18n';
import IconDesktopPairing from '../../components/ui/icon/icon-desktop-pairing';
import { Icon } from '../../components/component-library/icon/icon';
import {
  TEXT_ALIGN,
  TYPOGRAPHY,
  DISPLAY,
  ALIGN_ITEMS,
  FLEX_DIRECTION,
  COLORS,
} from '../../helpers/constants/design-system';
import Box from '../../components/ui/box/box';
import ActionableMessage from '../../components/ui/actionable-message/actionable-message';
import { openCustomProtocol } from '../../../shared/lib/deep-linking';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import Tooltip from '../../components/ui/tooltip';

export default function DesktopPairingPage({
  generateOtp,
  mostRecentOverviewPage,
  showLoadingIndication,
  hideLoadingIndication,
  shouldShowWarning,
  hideWarning,
}) {
  const t = useContext(I18nContext);
  const history = useHistory();
  const OTP_DURATION = SECOND * 30;
  const REFRESH_INTERVAL = SECOND;
  const time = new Date().getTime();

  const [otp, setOtp] = useState();
  const [lastOtpTime, setLastOtpTime] = useState(time);
  const [currentTime, setCurrentTime] = useState(time);
  const [copied, handleCopy] = useCopyToClipboard();
  const generateIntervalRef = useRef();
  const refreshIntervalRef = useRef();

  const generate = async () => {
    setLastOtpTime(new Date().getTime());
    setOtp(await generateOtp());
  };

  const updateCurrentTime = () => {
    setCurrentTime(new Date().getTime());
  };

  const getExpireDuration = () => {
    const timeSinceOtp = currentTime - lastOtpTime;
    const expireDurationMilliseconds = OTP_DURATION - timeSinceOtp;

    const expireDurationSeconds = Math.round(
      expireDurationMilliseconds / SECOND,
    );

    return expireDurationSeconds;
  };

  const openSettingsOrDownloadMMD = () => {
    openCustomProtocol('metamask-desktop://pair').catch(() => {
      window.open('https://metamask.io/download.html', '_blank').focus();
    });
  };

  useEffect(() => {
    generate();
    updateCurrentTime();

    generateIntervalRef.current = setInterval(() => generate(), OTP_DURATION);
    refreshIntervalRef.current = setInterval(
      () => updateCurrentTime(),
      REFRESH_INTERVAL,
    );

    return function cleanup() {
      clearInterval(generateIntervalRef.current);
      clearInterval(refreshIntervalRef.current);
    };
  }, [OTP_DURATION, REFRESH_INTERVAL]);

  const renderIcon = () => {
    return (
      <div>
        <Box
          display={DISPLAY.FLEX}
          alignItems={ALIGN_ITEMS.CENTER}
          textAlign={TEXT_ALIGN.CENTER}
          flexDirection={FLEX_DIRECTION.COLUMN}
          marginLeft={6}
          marginRight={6}
          marginTop={shouldShowWarning ? 0 : 12}
        >
          <IconDesktopPairing size={64} />
        </Box>
      </div>
    );
  };

  const goBack = () => {
    history?.push(mostRecentOverviewPage);
  };

  const renderContent = () => {
    if (!otp) {
      showLoadingIndication();
      return null;
    }

    hideLoadingIndication();

    return (
      <div
        className="desktop-pairing__clickable"
        onClick={() => {
          handleCopy(otp);
        }}
      >
        <Box
          display={DISPLAY.FLEX}
          alignItems={ALIGN_ITEMS.CENTER}
          textAlign={TEXT_ALIGN.CENTER}
          flexDirection={FLEX_DIRECTION.COLUMN}
          marginLeft={6}
          marginRight={6}
        >
          <Tooltip
            wrapperClassName="desktop-pairing__tooltip-wrapper"
            position="top"
            title={copied ? t('copiedExclamation') : t('copyToClipboard')}
          >
            <Typography
              align={TEXT_ALIGN.CENTER}
              className="desktop-pairing__otp"
            >
              {otp}
            </Typography>
          </Tooltip>
        </Box>

        <Typography
          variant={TYPOGRAPHY.Paragraph}
          align={TEXT_ALIGN.CENTER}
          className="desktop-pairing__countdown-timer"
        >
          Code expires in{' '}
          <span className="desktop-pairing__countdown-timer-seconds">
            {getExpireDuration()}
          </span>{' '}
          seconds
        </Typography>
        <div className="desktop-pairing__description">
          {t('desktopPageDescription')}
        </div>
      </div>
    );
  };

  const renderFooter = () => {
    return (
      <div className="desktop-pairing__buttons">
        <Button
          type="primary"
          rounded
          onClick={() => {
            goBack();
          }}
        >
          {t('done')}
        </Button>
      </div>
    );
  };

  const renderWarning = () => {
    return (
      shouldShowWarning && (
        <ActionableMessage
          type="warning"
          message={
            <div className="desktop-pairing-warning__warning-container">
              <Box
                className="desktop-pairing-warning__close-button__close"
                marginLeft={2}
                marginTop={0}
                color={COLORS.ICON_ALTERNATIVE}
                onClick={() => hideWarning()}
              />
              <div className="desktop-pairing-warning__title">
                {t('desktopPairedWarningTitle')}
              </div>
              <div className="desktop-pairing-warning__text">
                {t('desktopPairedWarningDescription')}
                <Button
                  type="link"
                  onClick={() => {
                    openSettingsOrDownloadMMD();
                  }}
                  className="desktop-pairing-warning__link"
                >
                  {t('desktopPairedWarningDeepLink')}
                </Button>
              </div>
            </div>
          }
          useIcon
          iconFillColor="var(--color-warning-default)"
          className="desktop-pairing-warning__warning-content"
          withRightButton
          icon={<Icon name="danger-filled" color={COLORS.WARNING_DEFAULT} />}
        />
      )
    );
  };

  return (
    <div className="page-container__content">
      {renderWarning()}
      <div className="desktop-pairing">
        {renderIcon()}
        <div className="desktop-pairing__title">{t('desktopPageTitle')}</div>
        <div className="desktop-pairing__subtitle">
          {t('desktopPageSubTitle')}
        </div>
      </div>
      <div className="desktop-pairing">{renderContent()}</div>
      {renderFooter()}
    </div>
  );
}

DesktopPairingPage.propTypes = {
  mostRecentOverviewPage: PropTypes.string,
  showLoadingIndication: PropTypes.func,
  hideLoadingIndication: PropTypes.func,
  generateOtp: PropTypes.func,
  shouldShowWarning: PropTypes.string,
  hideWarning: PropTypes.func,
};
