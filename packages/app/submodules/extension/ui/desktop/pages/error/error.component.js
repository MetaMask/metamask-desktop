import React from 'react';
import { useParams } from 'react-router-dom';
import { PropTypes } from 'prop-types';

import useI18nContext from '../../hooks/useI18nContext';
import { renderDesktopError } from '../../../pages/desktop-error/render-desktop-error';

const ErrorPage = ({ history }) => {
  const t = useI18nContext();
  const { errorType } = useParams();

  return (
    <div className="mmd-error-page">
      {renderDesktopError({
        type: errorType,
        t,
        isHtmlError: false,
        history,
      })}
    </div>
  );
};

ErrorPage.propTypes = {
  /**
   * History object from react-router
   */
  history: PropTypes.object,
};

export default ErrorPage;
