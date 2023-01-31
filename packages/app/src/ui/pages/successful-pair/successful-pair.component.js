import EventEmitter from 'events';
import React, { useEffect } from 'react';
import { PropTypes } from 'prop-types';

import Mascot from '../../components/mascot';
import useI18nContext from '../../hooks/useI18nContext';
import Typography from '../../../../submodules/extension/ui/components/ui/typography';
import Box from '../../../../submodules/extension/ui/components/ui/box';
import Button from '../../../../submodules/extension/ui/components/ui/button';
import {
  FONT_WEIGHT,
  TYPOGRAPHY,
  DISPLAY,
  FLEX_DIRECTION,
} from '../../../../submodules/extension/ui/helpers/constants/design-system';
import { PAIR_ROUTE, SETTINGS_ROUTE } from '../../helpers/constants/routes';

const SuccessfulPair = ({
  history,
  updateSuccessfulPairSeen,
  isDesktopPaired,
}) => {
  const t = useI18nContext();
  const animationEventEmitter = new EventEmitter();

  useEffect(() => {
    if (!isDesktopPaired) {
      __electronLog.log('Unpaired, redirecting back to pair');
      history.push(PAIR_ROUTE);
    }
  }, [isDesktopPaired, history]);

  const handleGoToSettings = () => {
    updateSuccessfulPairSeen();
    history.push(SETTINGS_ROUTE);
  };

  return (
    <div className="mmd-successful-pair-page">
      <Mascot
        animationEventEmitter={animationEventEmitter}
        width="150"
        height="150"
      />
      <Typography variant={TYPOGRAPHY.H3} fontWeight={FONT_WEIGHT.BOLD}>
        {t('pairingComplete')}
      </Typography>
      <Typography
        className="description"
        variant={TYPOGRAPHY.Paragraph}
        fontSize={14}
      >
        {t('someExplainer')}
      </Typography>
      <Box
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.COLUMN}
        marginTop={8}
      >
        <Button type="primary" onClick={handleGoToSettings}>
          {t('goToSettings')}
        </Button>
      </Box>
    </div>
  );
};

SuccessfulPair.propTypes = {
  /**
   * History object from react-router
   */
  history: PropTypes.object,
  /**
   * Function to update the successful pair seen state
   */
  updateSuccessfulPairSeen: PropTypes.func,
  /**
   * Whether or not the app is paired with the extension
   */
  isDesktopPaired: PropTypes.bool,
};

export default SuccessfulPair;
