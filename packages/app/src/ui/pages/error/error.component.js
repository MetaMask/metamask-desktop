import React from 'react';
import { useParams } from 'react-router-dom';
import { PropTypes } from 'prop-types';

import useI18nContext from '../../hooks/useI18nContext';
import { renderDesktopError } from '../../../../submodules/extension/ui/pages/desktop-error/render-desktop-error';

const ErrorPage = ({ history, errorType: errorTypeProp }) => {
  const t = useI18nContext();
  const { errorType } = useParams();

  return (
    <div className="mmd-error-page">
      {renderDesktopError({
        type: errorType || errorTypeProp,
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
  /**
   * Error type from react-router
   */
  errorType: PropTypes.string,
};

export default ErrorPage;
