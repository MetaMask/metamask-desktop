import EventEmitter from 'events';
import React, { useEffect } from 'react';
import { PropTypes } from 'prop-types';
import OtpInput from 'react-otp-input';

import {
  SETTINGS_ROUTE,
  SUCCESSFUL_PAIR_ROUTE,
} from '../../helpers/constants/routes';
import useI18nContext from '../../hooks/useI18nContext';
import Typography from '../../../submodules/extension/ui/components/ui/typography';
import Button from '../../../submodules/extension/ui/components/ui/button';
import SettingIcon from '../../components/icons/settings-icon';
import {
  FONT_WEIGHT,
  TYPOGRAPHY,
  COLORS,
  TEXT_ALIGN,
} from '../../../submodules/extension/ui/helpers/constants/design-system';
import Mascot from '../../components/mascot';
import Spinner from '../../../submodules/extension/ui/components/ui/spinner';
import { metamaskDesktopSubmitTicket } from '../../helpers/constants/links';

const ANIMATION_COMPLETE_DEFER_IN_MS = 1000;
const OTP_VALIDATION_TIMEOUT_IN_MS = 5000;

const Pair = ({ isDesktopPaired, isSuccessfulPairSeen, history }) => {
  const t = useI18nContext();
  const [otp, setOtp] = React.useState('');
  const [isOtpValidating, setOtpValidating] = React.useState(false);
  const [isInvalidOtpError, setInvalidOtpError] = React.useState(false);
  const [isOtpTimeoutError, setOtpTimeoutError] = React.useState(false);
  const [otpValidationTimeoutId, setOtpValidationTimeoutId] =
    React.useState(null);
  const [isOtpDisabled, setOtpDisabled] = React.useState(false);
  const animationEventEmitter = new EventEmitter();

  useEffect(() => {
    window.electronBridge.onInvalidOtp(() => {
      setOtpDisabled(false);
      setInvalidOtpError(true);
      setOtpValidating(false);
    });

    // window.electronBridge.simulateError(() => {
    //   const error = new Error('Error render process')
    //   console.error('Something wrong happened on render process', error)
    //   throw error
    // });

    return () => {
      window.electronBridge.removeInvalidOtpListeners();
    };
  }, []);

  useEffect(() => {
    if (isDesktopPaired) {
      __electronLog.log('Paired, redirecting');
      clearTimeout(otpValidationTimeoutId);
      if (isSuccessfulPairSeen) {
        history.push(SETTINGS_ROUTE);
      } else {
        history.push(SUCCESSFUL_PAIR_ROUTE);
      }
    }
  }, [isDesktopPaired, isSuccessfulPairSeen, history, otpValidationTimeoutId]);

  const handleOTPChange = (otpValue) => {
    setOtp(otpValue);
    if (otpValue.length === 6) {
      setOtpDisabled(true);
      setOtpValidating(true);

      // This timeout for the animation to complete
      setTimeout(() => {
        window.electronBridge.sendOtp(otpValue);
      }, ANIMATION_COMPLETE_DEFER_IN_MS);

      // Show timeout error after 5 seconds of no response when validating
      const timeoutId = setTimeout(() => {
        setOtpTimeoutError(true);
        setOtpValidating(false);
        setOtpDisabled(false);
      }, OTP_VALIDATION_TIMEOUT_IN_MS + ANIMATION_COMPLETE_DEFER_IN_MS);
      setOtpValidationTimeoutId(timeoutId);
    }
  };

  const handleOnSettinsIconClick = () => {
    history.push(SETTINGS_ROUTE);
  };

  return (
    <>
      <div
        className="mmd-pair-page__settings-icon"
        onClick={handleOnSettinsIconClick}
      >
        <SettingIcon width="24" height="24" fill="var(--color-text-muted)" />
      </div>
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
          <div className="mmd-pair-page__otp-input__container">
            <OtpInput
              data-testid="pair-otp-input"
              isInputNum
              isDisabled={isOtpDisabled}
              hasErrored={isInvalidOtpError || isOtpTimeoutError}
              value={otp}
              onChange={handleOTPChange}
              numInputs={6}
              inputStyle="mmd-pair-page__otp-input"
              disabledStyle="mmd-pair-page__otp-input__disabled"
              errorStyle="mmd-pair-page__otp-input__error"
            />
            {isInvalidOtpError && (
              <Typography
                variant={TYPOGRAPHY.Paragraph}
                fontSize={14}
                color={COLORS.ERROR_DEFAULT}
                align={TEXT_ALIGN.CENTER}
                className="mmd-pair-page__otp-input__error-message"
              >
                {t('invalidOtpCode')}
              </Typography>
            )}
            {isOtpTimeoutError && (
              <Typography
                variant={TYPOGRAPHY.Paragraph}
                fontSize={14}
                color={COLORS.ERROR_DEFAULT}
                align={TEXT_ALIGN.CENTER}
                className="mmd-pair-page__otp-input__error-message"
              >
                {t('otpTimeoutError')}
              </Typography>
            )}
          </div>
        )}
        <Button
          type="link"
          className="support-link"
          onClick={() => {
            window.electronBridge.openExternalShell(
              metamaskDesktopSubmitTicket,
            );
          }}
        >
          {t('needSupport')}
        </Button>
      </div>
    </>
  );
};

Pair.propTypes = {
  /**
   * Whether the app is paired with the extension
   */
  isDesktopPaired: PropTypes.bool,
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
