import React from 'react';
import Button from '../../../../components/ui/button';

import { SUPPORT_REQUEST_LINK } from '../../../../helpers/constants/common';
import { SUPPORT_LINK } from '../../../../../shared/lib/ui-utils';
import useI18nContext from '../../../hooks/useI18nContext';

const AboutTab = () => {
  const t = useI18nContext();

  return (
    <>
      <div className="about-tab__item">
        <div className="about-tab__link-header">MetaMask Desktop</div>
        <div className="about-tab__version-number">0.0.0</div>
      </div>
      <hr className="about-tab__separator" />
      <div className="about-tab__link-header">{t('links')}</div>
      <div className="about-tab__link-item">
        <Button
          type="link"
          href="https://metamask.io/privacy.html"
          target="_blank"
          rel="noopener noreferrer"
          className="about-tab__link-text"
        >
          {t('privacyMsg')}
        </Button>
      </div>
      <div className="about-tab__link-item">
        <Button
          type="link"
          href="https://metamask.io/terms.html"
          target="_blank"
          rel="noopener noreferrer"
          className="about-tab__link-text"
        >
          {t('terms')}
        </Button>
      </div>
      <div className="about-tab__link-item">
        <Button
          type="link"
          href="https://metamask.io/attributions.html"
          target="_blank"
          rel="noopener noreferrer"
          className="about-tab__link-text"
        >
          {t('attributions')}
        </Button>
      </div>
      <hr className="about-tab__separator" />
      <div className="about-tab__link-item">
        <Button
          type="link"
          href={SUPPORT_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="about-tab__link-text"
        >
          {t('supportCenter')}
        </Button>
      </div>
      <div className="about-tab__link-item">
        <Button
          type="link"
          href="https://metamask.io/"
          target="_blank"
          rel="noopener noreferrer"
          className="about-tab__link-text"
        >
          {t('visitWebSite')}
        </Button>
      </div>
      <div className="about-tab__link-item">
        <Button
          type="link"
          href={SUPPORT_REQUEST_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="about-tab__link-text"
        >
          {t('contactUs')}
        </Button>
      </div>
    </>
  );
};

export default AboutTab;
