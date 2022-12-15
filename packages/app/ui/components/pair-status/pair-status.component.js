import React from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';

import useI18nContext from '../../hooks/useI18nContext';
import Chip from '../../../submodules/extension/ui/components/ui/chip';
import Typography from '../../../submodules/extension/ui/components/ui/typography';
import Button from '../../../submodules/extension/ui/components/ui/button';
import {
  COLORS,
  TYPOGRAPHY,
  FONT_WEIGHT,
} from '../../../submodules/extension/ui/helpers/constants/design-system';
import { formatDate } from '../../../submodules/extension/ui/helpers/utils/util';
import { PAIR_ROUTE } from '../../helpers/constants/routes';

const PairStatus = ({
  isWebSocketConnected,
  lastActivation,
  isPairingEverCompleted,
}) => {
  const t = useI18nContext();
  const history = useHistory();

  const renderChip = () => {
    const color = isWebSocketConnected
      ? COLORS.SUCCESS_DEFAULT
      : COLORS.ERROR_DEFAULT;
    const bgColor = isWebSocketConnected
      ? COLORS.SUCCESS_MUTED
      : COLORS.ERROR_MUTED;
    const label = isWebSocketConnected ? t('active') : t('inactive');

    return (
      <Chip
        className="mmd-pair-status__status__chip"
        borderColor={color}
        backgroundColor={bgColor}
      >
        <Typography
          variant={TYPOGRAPHY.Paragraph}
          fontWeight={FONT_WEIGHT.BOLD}
          color={color}
        >
          {label}
        </Typography>
      </Chip>
    );
  };

  const renderPairNowButton = () => {
    return (
      <div className="mmd-pair-status__pair-now">
        <Button
          className="mmd-pair-status__pair-now-button"
          type="secondary"
          onClick={() => {
            history.push(PAIR_ROUTE);
          }}
        >
          {t('pairNow')}
        </Button>
      </div>
    );
  };

  const renderlastActivation = () => {
    return formatDate(lastActivation);
  };

  if (!isPairingEverCompleted) {
    return renderPairNowButton();
  }

  return (
    <div className="mmd-pair-status">
      <div className="mmd-pair-status__status">
        {t('status')} {renderChip()}
      </div>
      {isWebSocketConnected && (
        <div className="mmd-pair-status__last-active">
          {t('lastTimeActive')} {renderlastActivation()}
        </div>
      )}
    </div>
  );
};

PairStatus.propTypes = {
  /**
   * Whether the web socket is connected with the extension
   */
  isWebSocketConnected: PropTypes.bool,
  /**
   * The last time the desktop app was activated
   */
  lastActivation: PropTypes.number,
  /**
   * Whether the desktop app has ever been paired with the extension
   */
  isPairingEverCompleted: PropTypes.bool,
};

export default PairStatus;
