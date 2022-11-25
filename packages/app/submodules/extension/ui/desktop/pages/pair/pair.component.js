import EventEmitter from 'events';
import React, { useEffect } from 'react';
import { PropTypes } from 'prop-types';
import OtpInput from 'react-otp-input';

import {
  SETTINGS_ROUTE,
  SUCCESSFUL_PAIR_ROUTE,
} from '../../helpers/constants/routes';
import useI18nContext from '../../hooks/useI18nContext';
import Typography from '../../../components/ui/typography';
import {
  FONT_WEIGHT,
  TYPOGRAPHY,
} from '../../../helpers/constants/design-system';
import Mascot from '../../../components/ui/mascot';
import Spinner from '../../../components/ui/spinner';

// eslint-disable-next-line node/no-extraneous-require
const { ipcRenderer } = window.require('electron');

const Pair = ({ isDesktopEnabled, isSuccessfulPairSeen, history }) => {
  const t = useI18nContext();
  const [otp, setOtp] = React.useState('');
  const [isOtpValidating, setOtpValidating] = React.useState(false);
  const [otpError, setOtpError] = React.useState();
  const [isOtpDisabled, setOtpDisabled] = React.useState(false);
  const animationEventEmitter = new EventEmitter();

  useEffect(() => {
    ipcRenderer.on('invalid-otp', () => {
      setOtpDisabled(false);
      setOtpError(true);
      setOtpValidating(false);
    });
    return () => {
      ipcRenderer.removeAllListeners('invalid-otp');
    };
  }, []);

  useEffect(() => {
    if (isDesktopEnabled) {
      console.log('Paired, redirecting');
      if (isSuccessfulPairSeen) {
        history.push(SETTINGS_ROUTE);
      } else {
        history.push(SUCCESSFUL_PAIR_ROUTE);
      }
    }
  }, [isDesktopEnabled, isSuccessfulPairSeen, history]);

  const handleOTPChange = (otpValue) => {
    setOtp(otpValue);
    if (otpValue.length === 6) {
      setOtpDisabled(true);
      setOtpValidating(true);
      setTimeout(() => {
        ipcRenderer.invoke('otp', otpValue);
      }, 1000);
    }
  };

  return (
    <div className="mmd-pair-page">
      <Mascot
        animationEventEmitter={animationEventEmitter}
        width="150"
        height="150"
      />
      <Typography variant={TYPOGRAPHY.H3} fontWeight={FONT_WEIGHT.BOLD}>
        {t('syncWithExtension')}
      </Typography>
      <Typography variant={TYPOGRAPHY.Paragraph} fontSize={14}>
        {t('typeTheSixDigitCodeBelow')}
      </Typography>
      {isOtpValidating ? (
        <Spinner
          className="mmd-pair-page__spinner"
          color="var(--color-secondary-default)"
        />
      ) : (
        <OtpInput
          isInputNum
          isDisabled={isOtpDisabled}
          hasErrored={Boolean(otpError)}
          value={otp}
          onChange={handleOTPChange}
          numInputs={6}
          inputStyle="mmd-pair-page__otp-input"
          containerStyle="mmd-pair-page__otp-input__container"
          disabledStyle="mmd-pair-page__otp-input__disabled"
          errorStyle="mmd-pair-page__otp-input__error"
        />
      )}
    </div>
  );
};

Pair.propTypes = {
  /**
   * Whether the app is paired with the extension
   */
  isDesktopEnabled: PropTypes.bool,
  /**
   * History object from react-router
   */
  history: PropTypes.any,
  /**
   * Whether the user has seen the successful pair screen
   */
  isSuccessfulPairSeen: PropTypes.bool,
};

export default Pair;
