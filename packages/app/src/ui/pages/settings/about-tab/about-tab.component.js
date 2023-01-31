import React, { useEffect, useState } from 'react';
import Button from '../../../../../submodules/extension/ui/components/ui/button';

import { SUPPORT_REQUEST_LINK } from '../../../../../submodules/extension/ui/helpers/constants/common';
import { SUPPORT_LINK } from '../../../../../submodules/extension/shared/lib/ui-utils';
import useI18nContext from '../../../hooks/useI18nContext';

const AboutTab = () => {
  const t = useI18nContext();
  const [desktopVersion, setDesktopVersion] = useState('');

  useEffect(() => {
    window.electronBridge.desktopVersion().then((value) => {
      setDesktopVersion(value);
    });
  }, []);

  const handleLinkClick = (link) => (event) => {
    event.preventDefault();
    window.electronBridge.openExternalShell(link);
  };

  return (
    <>
      <div className="about-tab__item">
        <div className="about-tab__link-header">MetaMask Desktop</div>
        <div className="about-tab__version-number">{desktopVersion}</div>
      </div>
      <hr className="about-tab__separator" />
      <div className="about-tab__link-header">{t('links')}</div>
      <div className="about-tab__link-item">
        <Button
          type="link"
          target="_blank"
          rel="noopener noreferrer"
          className="about-tab__link-text"
          onClick={handleLinkClick('https://metamask.io/privacy.html')}
        >
          {t('privacyMsg')}
        </Button>
      </div>
      <div className="about-tab__link-item">
        <Button
          type="link"
          target="_blank"
          rel="noopener noreferrer"
          className="about-tab__link-text"
          onClick={handleLinkClick('https://metamask.io/terms.html')}
        >
          {t('terms')}
        </Button>
      </div>
      <div className="about-tab__link-item">
        <Button
          type="link"
          target="_blank"
          rel="noopener noreferrer"
          className="about-tab__link-text"
          onClick={handleLinkClick('https://metamask.io/attributions.html')}
        >
          {t('attributions')}
        </Button>
      </div>
      <hr className="about-tab__separator" />
      <div className="about-tab__link-item">
        <Button
          type="link"
          target="_blank"
          rel="noopener noreferrer"
          className="about-tab__link-text"
          onClick={handleLinkClick(SUPPORT_LINK)}
        >
          {t('supportCenter')}
        </Button>
      </div>
      <div className="about-tab__link-item">
        <Button
          type="link"
          target="_blank"
          rel="noopener noreferrer"
          className="about-tab__link-text"
          onClick={handleLinkClick('https://metamask.io/')}
        >
          {t('visitWebSite')}
        </Button>
      </div>
      <div className="about-tab__link-item">
        <Button
          type="link"
          target="_blank"
          rel="noopener noreferrer"
          className="about-tab__link-text"
          onClick={handleLinkClick(SUPPORT_REQUEST_LINK)}
        >
          {t('contactUs')}
        </Button>
      </div>
    </>
  );
};

export default AboutTab;
