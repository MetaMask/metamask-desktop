import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Dropdown from '../../../components/ui/dropdown';

// Subviews
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import JsonImportView from './json';
import PrivateKeyImportView from './private-key';

export default class AccountImportSubview extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  state = {};

  getMenuItemTexts() {
    return [this.context.t('privateKey'), this.context.t('jsonFile')];
  }

  renderImportView() {
    const { type } = this.state;
    const menuItems = this.getMenuItemTexts();
    const current = type || menuItems[0];

    switch (current) {
      case this.context.t('privateKey'):
        return <PrivateKeyImportView />;
      case this.context.t('jsonFile'):
        return <JsonImportView />;
      default:
        return <JsonImportView />;
    }
  }

  render() {
    const menuItems = this.getMenuItemTexts();
    const { type } = this.state;
    const { t } = this.context;

    return (
      <>
        <div className="page-container__header">
          <div className="page-container__title">{t('importAccount')}</div>
          <div className="page-container__subtitle">
            {t('importAccountMsg')}
            <span
              className="new-account-info-link"
              onClick={() => {
                global.platform.openTab({
                  url: ZENDESK_URLS.IMPORTED_ACCOUNTS,
                });
              }}
            >
              {t('here')}
            </span>
          </div>
        </div>
        <div className="new-account-import-form">
          <div className="new-account-import-form__select-section">
            <div className="new-account-import-form__select-label">
              {t('selectType')}
            </div>
            <Dropdown
              className="new-account-import-form__select"
              options={menuItems.map((text) => ({ value: text }))}
              selectedOption={type || menuItems[0]}
              onChange={(value) => {
                this.setState({ type: value });
              }}
            />
          </div>
          {this.renderImportView()}
        </div>
      </>
    );
  }
}
