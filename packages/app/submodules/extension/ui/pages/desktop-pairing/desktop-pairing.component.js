import React, { useState, useEffect, useRef, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';
import Button from '../../components/ui/button';
import { SECOND } from '../../../shared/constants/time';
import Typography from '../../components/ui/typography';
import { I18nContext } from '../../contexts/i18n';
import IconDesktopPairing from '../../components/ui/icon/icon-desktop-pairing';
import {
  TEXT_ALIGN,
  TYPOGRAPHY,
  DISPLAY,
  ALIGN_ITEMS,
  FLEX_DIRECTION,
} from '../../helpers/constants/design-system';
import Box from '../../components/ui/box/box';

export default function DesktopPairingPage({
  generateOtp,
  mostRecentOverviewPage,
  showLoadingIndication,
  hideLoadingIndication,
}) {
  const t = useContext(I18nContext);
  const history = useHistory();
  const OTP_DURATION = SECOND * 30;
  const REFRESH_INTERVAL = SECOND;
  const time = new Date().getTime();

  const [otp, setOtp] = useState();
  const [lastOtpTime, setLastOtpTime] = useState(time);
  const [currentTime, setCurrentTime] = useState(time);
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
          marginTop={12}
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
            {getExpireDuration()}
          </span>{' '}
          seconds
        </Typography>
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

  return (
    <div className="page-container__content">
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
};
