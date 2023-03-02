import React, { useEffect, useState } from 'react';
import Button from '../../../../../submodules/extension/ui/components/ui/button';

import {
  URL_SUBMIT_TICKET,
  MMD_WEBSITE,
} from '../../../../shared/constants/links';
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
          onClick={handleLinkClick(URL_SUBMIT_TICKET)}
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
          onClick={handleLinkClick(MMD_WEBSITE)}
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
          onClick={handleLinkClick(URL_SUBMIT_TICKET)}
        >
          {t('contactUs')}
        </Button>
      </div>
    </>
  );
};

export default AboutTab;
