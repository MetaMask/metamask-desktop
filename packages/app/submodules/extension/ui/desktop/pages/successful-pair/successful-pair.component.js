import EventEmitter from 'events';
import React, { useEffect } from 'react';
import { PropTypes } from 'prop-types';

import Mascot from '../../../components/ui/mascot';
import useI18nContext from '../../hooks/useI18nContext';
import Typography from '../../../components/ui/typography';
import Box from '../../../components/ui/box';
import Button from '../../../components/ui/button';
import {
  FONT_WEIGHT,
  TYPOGRAPHY,
  DISPLAY,
  FLEX_DIRECTION,
} from '../../../helpers/constants/design-system';
import { PAIR_ROUTE, SETTINGS_ROUTE } from '../../helpers/constants/routes';

const SuccessfulPair = ({
  history,
  updateSuccessfulPairSeen,
  isDesktopEnabled,
}) => {
  const t = useI18nContext();
  const animationEventEmitter = new EventEmitter();

  useEffect(() => {
    if (!isDesktopEnabled) {
      console.log('Unpaired, redirecting back to pair');
      history.push(PAIR_ROUTE);
    }
  }, [isDesktopEnabled, history]);

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
        {t('allSetFox')}
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
   * Whether or not the desktop is enabled
   */
  isDesktopEnabled: PropTypes.bool,
};

export default SuccessfulPair;
