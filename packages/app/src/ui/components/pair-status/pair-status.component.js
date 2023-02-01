import React from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';

import useI18nContext from '../../hooks/useI18nContext';
import { PAIR_ROUTE } from '../../../shared/constants/ui-routes';
import Chip from '../../../../submodules/extension/ui/components/ui/chip';
import Typography from '../../../../submodules/extension/ui/components/ui/typography';
import Button from '../../../../submodules/extension/ui/components/ui/button';
import {
  COLORS,
  TYPOGRAPHY,
  FONT_WEIGHT,
} from '../../../../submodules/extension/ui/helpers/constants/design-system';
import { formatDate } from '../../../../submodules/extension/ui/helpers/utils/util';

const PairStatus = ({
  isWebSocketConnected,
  isDesktopPaired,
  lastActivation,
  isSuccessfulPairSeen,
}) => {
  const t = useI18nContext();
  const history = useHistory();

  const renderChip = ({ isActive }) => {
    const color = isActive ? COLORS.SUCCESS_DEFAULT : COLORS.ERROR_DEFAULT;
    const bgColor = isActive ? COLORS.SUCCESS_MUTED : COLORS.ERROR_MUTED;
    const label = isActive ? t('active') : t('inactive');

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

  const renderPairNowButton = ({ inProgress }) => {
    return (
      <div className="mmd-pair-status__pair-now">
        <Button
          className="mmd-pair-status__pair-now-button"
          type="secondary"
          onClick={() => {
            history.push(PAIR_ROUTE);
          }}
        >
          {inProgress ? t('pairInProgress') : t('pairNow')}
        </Button>
      </div>
    );
  };

  const renderlastActivation = () => {
    return formatDate(lastActivation);
  };

  const renderStatus = ({ isActive }) => {
    return (
      <div className="mmd-pair-status">
        <div className="mmd-pair-status__status">
          {t('status')} {renderChip({ isActive })}
        </div>
        {isWebSocketConnected && (
          <div className="mmd-pair-status__last-active">
            {t('lastTimeActive')} {renderlastActivation()}
          </div>
        )}
      </div>
    );
  };

  if (!isDesktopPaired && !isSuccessfulPairSeen) {
    if (isWebSocketConnected) {
      // Pairing, In Progress
      return renderPairNowButton({ inProgress: true });
    }
    // Never paired show pair now button
    return renderPairNowButton({ inProgress: false });
  }

  if (isDesktopPaired && isWebSocketConnected) {
    // Paired and connected
    return renderStatus({ isActive: true });
  }

  if (isSuccessfulPairSeen && !isWebSocketConnected) {
    // Paired before but not connected
    return renderStatus({ isActive: false });
  }

  return null;
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
   * Whether a successful pair has been seen
   */
  isSuccessfulPairSeen: PropTypes.bool,
  /**
   * Whether the app is paired with the extension
   */
  isDesktopPaired: PropTypes.bool,
};

export default PairStatus;
