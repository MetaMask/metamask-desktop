import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import useI18nContext from '../../hooks/useI18nContext';
import Chip from '../../../components/ui/chip';
import Typography from '../../../components/ui/typography';
import {
  COLORS,
  TYPOGRAPHY,
  FONT_WEIGHT,
} from '../../../helpers/constants/design-system';
import { formatDate } from '../../../helpers/utils/util';

const PairStatus = ({ isPaired, lastActivation }) => {
  const t = useI18nContext();

  const renderChip = () => {
    const color = isPaired ? COLORS.SUCCESS_DEFAULT : COLORS.ERROR_DEFAULT;
    const bgColor = isPaired ? COLORS.SUCCESS_MUTED : COLORS.ERROR_MUTED;
    const label = isPaired ? t('active') : t('inactive');

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

  const renderlastActivation = () => {
    return formatDate(lastActivation);
  };

  return (
    <div className="mmd-pair-status">
      <div className="mmd-pair-status__status">
        {t('status')} {renderChip()}
      </div>
      {isPaired ? (
        <div className="mmd-pair-status__last-active">
          {t('lastTimeActive')} {renderlastActivation()}
        </div>
      ) : (
        <div className="mmd-pair-status__last-active">
          <Link to="/pair">{t('temporaryPairLink')}</Link>
        </div>
      )}
    </div>
  );
};

PairStatus.propTypes = {
  /**
   * Whether the extension is paired with the app
   */
  isPaired: PropTypes.bool,
  /**
   * The last time the desktop app was activated
   */
  lastActivation: PropTypes.number,
};

export default PairStatus;
