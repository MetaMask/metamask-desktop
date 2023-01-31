import React from 'react';
import { PropTypes } from 'prop-types';

import useI18nContext from '../../hooks/useI18nContext';
import { metamaskDesktopSubmitTicket } from '../../helpers/constants/links';

const CriticalError = ({ error }) => {
  const t = useI18nContext();

  const renderErrorDetail = (content) => {
    return (
      <li>
        <p>{content}</p>
      </li>
    );
  };

  const renderErrorStack = (stack) => {
    return (
      <li>
        <pre className="mmd-error-page__stack">{stack}</pre>
      </li>
    );
  };

  const supportLink = (
    <a
      target="_blank"
      key="metamaskSupportLink"
      rel="noopener noreferrer"
      onClick={() => {
        window.electronBridge.openExternalShell(metamaskDesktopSubmitTicket);
      }}
    >
      <span className="error-page__link-text">{t('here')}</span>
    </a>
  );

  return (
    <div className="mmd-error-page">
      <h1 className="mmd-error-page__header">{t('errorPageTitle')}</h1>
      <h2 className="mmd-error-page__subheader">
        {t('errorPageMessage', [supportLink])}
      </h2>
      <section className="mmd-error-page__details">
        <details open>
          <summary>{t('errorDetails')}</summary>
          <ul>
            {error.message
              ? renderErrorDetail(t('errorMessage', [error.message]))
              : null}
            {error.code
              ? renderErrorDetail(t('errorCode', [error.code]))
              : null}
            {error.name
              ? renderErrorDetail(t('errorName', [error.name]))
              : null}
            {error.stack ? renderErrorStack(error.stack) : null}
          </ul>
        </details>
      </section>
    </div>
  );
};

CriticalError.propTypes = {
  /**
   * Error object
   */
  error: PropTypes.object.isRequired,
};

export default CriticalError;
