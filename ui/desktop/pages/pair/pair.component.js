import EventEmitter from 'events';
import React, { useEffect } from 'react';
import { PropTypes } from 'prop-types';
import OtpInput from 'react-otp-input';

import { SETTINGS_ROUTE } from '../../helpers/constants/routes';
import useI18nContext from '../../hooks/useI18nContext';
import Typography from '../../../components/ui/typography';
import {
  FONT_WEIGHT,
  TYPOGRAPHY,
} from '../../../helpers/constants/design-system';
import Mascot from '../../../components/ui/mascot';

const { ipcRenderer } = window.require('electron');

const Pair = ({ isPaired, history }) => {
  const t = useI18nContext();
  const [otp, setOtp] = React.useState('');
  const [otpError, setOtpError] = React.useState();
  const [isOTPDisabled, setOTPDisabled] = React.useState(false);
  const animationEventEmitter = new EventEmitter();

  useEffect(() => {
    ipcRenderer.on('invalid-otp', () => {
      setOTPDisabled(false);
      setOtpError(true);
    });
    return () => {
      ipcRenderer.removeAllListeners('invalid-otp');
    };
  }, []);

  useEffect(() => {
    if (isPaired) {
      console.log('Paired, redirecting');
      history.push(SETTINGS_ROUTE);
    }
  }, [isPaired, history]);

  const handleOTPChange = (otpValue) => {
    setOtp(otpValue);
    if (otpValue.length === 6) {
      setOTPDisabled(true);
      ipcRenderer.invoke('otp', otpValue);
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
      <OtpInput
        isInputNum
        isDisabled={isOTPDisabled}
        hasErrored={Boolean(otpError)}
        value={otp}
        onChange={handleOTPChange}
        numInputs={6}
        inputStyle="mmd-pair-page__otp-input"
        containerStyle="mmd-pair-page__otp-input__container"
        disabledStyle="mmd-pair-page__otp-input__disabled"
        errorStyle="mmd-pair-page__otp-input__error"
      />
    </div>
  );
};

Pair.propTypes = {
  /**
   * Whether the app is paired with the extension
   */
  isPaired: PropTypes.bool,
  /**
   * History object from react-router
   */
  history: PropTypes.any,
};

export default Pair;
