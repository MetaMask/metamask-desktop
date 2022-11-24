import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import ListItem from '../../ui/list-item';
import TransactionStatus from '../transaction-status/transaction-status.component';
import TransactionIcon from '../transaction-icon';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTransactionDisplayData } from '../../../hooks/useTransactionDisplayData';
import { formatDateWithYearContext } from '../../../helpers/utils/util';
import {
  TRANSACTION_GROUP_CATEGORIES,
  TRANSACTION_GROUP_STATUSES,
  SMART_TRANSACTION_STATUSES,
} from '../../../../shared/constants/transaction';

import CancelButton from '../cancel-button';
import { cancelSwapsSmartTransaction } from '../../../ducks/swaps/swaps';
import SiteOrigin from '../../ui/site-origin';
import TransactionListItemDetails from '../transaction-list-item-details';

export default function SmartTransactionListItem({
  smartTransaction,
  transactionGroup,
  isEarliestNonce = false,
}) {
  const dispatch = useDispatch();
  const t = useI18nContext();
  const [cancelSwapLinkClicked, setCancelSwapLinkClicked] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { primaryCurrency, recipientAddress, isPending, senderAddress } =
    useTransactionDisplayData(transactionGroup);
  const { sourceTokenSymbol, destinationTokenSymbol, time, status } =
    smartTransaction;
  const category = TRANSACTION_GROUP_CATEGORIES.SWAP;
  const title = t('swapTokenToToken', [
    sourceTokenSymbol,
    destinationTokenSymbol,
  ]);
  const subtitle = 'metamask';
  const date = formatDateWithYearContext(time);
  let displayedStatusKey;
  if (status === SMART_TRANSACTION_STATUSES.PENDING) {
    displayedStatusKey = TRANSACTION_GROUP_STATUSES.PENDING;
  } else if (status?.startsWith(SMART_TRANSACTION_STATUSES.CANCELLED)) {
    displayedStatusKey = TRANSACTION_GROUP_STATUSES.CANCELLED;
  }
  const showCancelSwapLink =
    smartTransaction.cancellable && !cancelSwapLinkClicked;
  const className = 'transaction-list-item transaction-list-item--unconfirmed';
  const toggleShowDetails = useCallback(() => {
    setShowDetails((prev) => !prev);
  }, []);
  return (
    <>
      <ListItem
        className={className}
        title={title}
        onClick={toggleShowDetails}
        icon={
          <TransactionIcon category={category} status={displayedStatusKey} />
        }
        subtitle={
          <h3>
            <TransactionStatus
              isPending
              isEarliestNonce={isEarliestNonce}
              date={date}
              status={displayedStatusKey}
            />
            <SiteOrigin
              className="transaction-list-item__origin"
              siteOrigin={subtitle}
              title={subtitle}
            />
          </h3>
        }
      >
        {displayedStatusKey === TRANSACTION_GROUP_STATUSES.PENDING &&
          showCancelSwapLink && (
            <div className="transaction-list-item__pending-actions">
              <CancelButton
                transaction={smartTransaction.uuid}
                cancelTransaction={(e) => {
                  e?.preventDefault();
                  dispatch(cancelSwapsSmartTransaction(smartTransaction.uuid));
                  setCancelSwapLinkClicked(true);
                }}
              />
            </div>
          )}
      </ListItem>
      {showDetails && (
        <TransactionListItemDetails
          title={title}
          onClose={toggleShowDetails}
          senderAddress={senderAddress}
          recipientAddress={recipientAddress}
          primaryCurrency={primaryCurrency}
          isEarliestNonce={isEarliestNonce}
          transactionGroup={transactionGroup}
          transactionStatus={() => (
            <TransactionStatus
              isPending={isPending}
              isEarliestNonce={isEarliestNonce}
              date={date}
              status={displayedStatusKey}
              statusOnly
            />
          )}
        />
      )}
    </>
  );
}

SmartTransactionListItem.propTypes = {
  smartTransaction: PropTypes.object.isRequired,
  isEarliestNonce: PropTypes.bool,
  transactionGroup: PropTypes.object,
};
