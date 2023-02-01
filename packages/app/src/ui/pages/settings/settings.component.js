import React from 'react';
import { PropTypes } from 'prop-types';
import { Switch, Route, matchPath, useHistory } from 'react-router-dom';

import {
  GENERAL_ROUTE,
  ABOUT_US_ROUTE,
  SETTINGS_ROUTE,
  PRIVACY_ROUTE,
} from '../../../shared/constants/ui-routes';
import TabBar from '../../../../submodules/extension/ui/components/app/tab-bar';
import Typography from '../../../../submodules/extension/ui/components/ui/typography';
import { TYPOGRAPHY } from '../../../../submodules/extension/ui/helpers/constants/design-system';
import useI18nContext from '../../hooks/useI18nContext';
import GeneralTab from './general-tab';
import AboutTab from './about-tab';
import PrivacyTab from './privacy-tab';

const Settings = ({ currentPath, isAboutPage, isPrivacyPage }) => {
  const t = useI18nContext();
  const history = useHistory();

  const renderTabs = () => {
    return (
      <TabBar
        tabs={[
          {
            content: t('general'),
            icon: <i className="fa fa-cog" />,
            key: GENERAL_ROUTE,
          },
          {
            content: t('about'),
            icon: <i className="fa fa-info-circle" />,
            key: ABOUT_US_ROUTE,
          },
          {
            content: t('privacy'),
            icon: <i className="fa fa-lock" />,
            key: PRIVACY_ROUTE,
          },
        ]}
        isActive={(key) => {
          if (key === GENERAL_ROUTE && currentPath === SETTINGS_ROUTE) {
            return true;
          }
          return matchPath(currentPath, { exact: true, path: key });
        }}
        onSelect={(key) => history.push(key)}
      />
    );
  };

  const renderContent = () => {
    return (
      <Switch>
        <Route
          path={[GENERAL_ROUTE, SETTINGS_ROUTE]}
          exact
          component={GeneralTab}
        />
        <Route path={ABOUT_US_ROUTE} exact component={AboutTab} />
        <Route path={PRIVACY_ROUTE} exact component={PrivacyTab} />
      </Switch>
    );
  };

  const renderTabTitle = () => {
    let subheaderText;

    if (isAboutPage) {
      subheaderText = t('about');
    } else if (isPrivacyPage) {
      subheaderText = t('privacy');
    } else {
      subheaderText = t('general');
    }

    return (
      <div className="mmd-settings-page__subheader">
        <Typography variant={TYPOGRAPHY.H4}>{subheaderText}</Typography>
      </div>
    );
  };

  return (
    <div className="mmd-settings-page">
      <div className="mmd-settings-page__header">
        <Typography variant={TYPOGRAPHY.H3}>{t('settings')}</Typography>
      </div>
      <div className="mmd-settings-page__content">
        <div className="mmd-settings-page__content__tabs">{renderTabs()}</div>
        <div className="mmd-settings-page__content__modules">
          {renderTabTitle()}
          <div className="mmd-settings-page__content__body">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

Settings.propTypes = {
  /**
   * Current page path
   */
  currentPath: PropTypes.string,
  /**
   * Whether the current page is the about page
   */
  isAboutPage: PropTypes.bool,
  /**
   * Whether the current page is the privacy page
   */
  isPrivacyPage: PropTypes.bool,
};

export default Settings;
