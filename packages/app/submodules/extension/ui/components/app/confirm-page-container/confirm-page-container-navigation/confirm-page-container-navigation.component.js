import React from 'react';
import PropTypes from 'prop-types';

const ConfirmPageContainerNavigation = (props) => {
  const {
    onNextTx,
    totalTx,
    positionOfCurrentTx,
    nextTxId,
    prevTxId,
    showNavigation,
    firstTx,
    lastTx,
    ofText,
    requestsWaitingText,
  } = props;

  return (
    <div
      className="confirm-page-container-navigation"
      style={{
        display: showNavigation ? 'flex' : 'none',
      }}
    >
      <div
        className="confirm-page-container-navigation__container"
        data-testid="navigation-container"
        style={{
          visibility: prevTxId ? 'initial' : 'hidden',
        }}
      >
        <button
          className="confirm-page-container-navigation__arrow"
          data-testid="first-page"
          onClick={() => onNextTx(firstTx)}
        >
          <i className="fa fa-angle-double-left fa-2x" />
        </button>
        <button
          className="confirm-page-container-navigation__arrow"
          data-testid="previous-page"
          onClick={() => onNextTx(prevTxId)}
        >
          <i className="fa fa-angle-left fa-2x" />
        </button>
      </div>
      <div className="confirm-page-container-navigation__textcontainer">
        <div className="confirm-page-container-navigation__navtext">
          {positionOfCurrentTx} {ofText} {totalTx}
        </div>
        <div className="confirm-page-container-navigation__longtext">
          {requestsWaitingText}
        </div>
      </div>
      <div
        className="confirm-page-container-navigation__container"
        style={{
          visibility: nextTxId ? 'initial' : 'hidden',
        }}
      >
        <button
          className="confirm-page-container-navigation__arrow"
          data-testid="next-page"
          onClick={() => onNextTx(nextTxId)}
        >
          <i className="fa fa-angle-right fa-2x" />
        </button>
        <button
          className="confirm-page-container-navigation__arrow"
          data-testid="last-page"
          onClick={() => onNextTx(lastTx)}
        >
          <i className="fa fa-angle-double-right fa-2x" />
        </button>
      </div>
    </div>
  );
};

ConfirmPageContainerNavigation.propTypes = {
  totalTx: PropTypes.number,
  positionOfCurrentTx: PropTypes.number,
  onNextTx: PropTypes.func,
  nextTxId: PropTypes.string,
  prevTxId: PropTypes.string,
  showNavigation: PropTypes.bool,
  firstTx: PropTypes.string,
  lastTx: PropTypes.string,
  ofText: PropTypes.string,
  requestsWaitingText: PropTypes.string,
};

export default ConfirmPageContainerNavigation;
