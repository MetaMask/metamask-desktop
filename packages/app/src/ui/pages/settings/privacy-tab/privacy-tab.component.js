import React from 'react';
import PropTypes from 'prop-types';

import Typography from '../../../../../submodules/extension/ui/components/ui/typography';
import ToggleButton from '../../../../../submodules/extension/ui/components/ui/toggle-button';
import { TYPOGRAPHY } from '../../../../../submodules/extension/ui/helpers/constants/design-system';
import useI18nContext from '../../../hooks/useI18nContext';

const PrivacyTab = ({ metametricsOptIn, updateMetametricsOptIn }) => {
  const t = useI18nContext();
  const renderMetametricsOptIn = () => {
    return (
      <div className="mmd-settings-page__setting-row">
        <div className="mmd-settings-page__setting-item">
          <Typography variant={TYPOGRAPHY.H5}>
            {t('participateInMetaMetrics')}
          </Typography>
          <Typography variant={TYPOGRAPHY.H6}>
            {t('participateInMetaMetricsDescription')}
          </Typography>
        </div>
        <div className="mmd-settings-page__setting-item">
          <div className="mmd-settings-page__setting-col">
            <ToggleButton
              value={metametricsOptIn}
              onToggle={(value) => updateMetametricsOptIn(!value)}
              offLabel={t('off')}
              onLabel={t('on')}
            />
          </div>
        </div>
      </div>
    );
  };

  return <>{renderMetametricsOptIn()}</>;
};

PrivacyTab.propTypes = {
  /**
   * Updates the user's metametrics opt in preference
   */
  updateMetametricsOptIn: PropTypes.func,
  /**
   * Representing the user's current metametrics opt in preference
   */
  metametricsOptIn: PropTypes.bool,
};

export default PrivacyTab;
