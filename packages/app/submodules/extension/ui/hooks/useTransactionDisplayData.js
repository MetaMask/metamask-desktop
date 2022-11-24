import { useDispatch, useSelector } from 'react-redux';
import { getKnownMethodData } from '../selectors/selectors';
import {
  getStatusKey,
  getTransactionTypeTitle,
} from '../helpers/utils/transactions.util';
import { camelCaseToCapitalize } from '../helpers/utils/common.util';
import { PRIMARY, SECONDARY } from '../helpers/constants/common';
import {
  getTokenAddressParam,
  getTokenIdParam,
} from '../helpers/utils/token-util';
import {
  formatDateWithYearContext,
  shortenAddress,
  stripHttpSchemes,
} from '../helpers/utils/util';

import {
  PENDING_STATUS_HASH,
  TOKEN_CATEGORY_HASH,
} from '../helpers/constants/transactions';
import { getCollectibles, getTokens } from '../ducks/metamask/metamask';
import {
  TRANSACTION_TYPES,
  TRANSACTION_GROUP_CATEGORIES,
  TRANSACTION_STATUSES,
} from '../../shared/constants/transaction';
import { captureSingleException } from '../store/actions';
import { isEqualCaseInsensitive } from '../../shared/modules/string-utils';
import { getTokenValueParam } from '../../shared/lib/metamask-controller-utils';
import { useI18nContext } from './useI18nContext';
import { useTokenFiatAmount } from './useTokenFiatAmount';
import { useUserPreferencedCurrency } from './useUserPreferencedCurrency';
import { useCurrencyDisplay } from './useCurrencyDisplay';
import { useTokenDisplayValue } from './useTokenDisplayValue';
import { useTokenData } from './useTokenData';
import { useSwappedTokenValue } from './useSwappedTokenValue';
import { useCurrentAsset } from './useCurrentAsset';

/**
 *  There are seven types of transaction entries that are currently differentiated in the design:
 *  1. Signature request
 *  2. Send (sendEth sendTokens)
 *  3. Deposit
 *  4. Site interaction
 *  5. Approval
 *  6. Swap
 *  7. Swap Approval
 */
const signatureTypes = [
  null,
  undefined,
  TRANSACTION_TYPES.SIGN,
  TRANSACTION_TYPES.PERSONAL_SIGN,
  TRANSACTION_TYPES.SIGN_TYPED_DATA,
  TRANSACTION_TYPES.ETH_DECRYPT,
  TRANSACTION_TYPES.ETH_GET_ENCRYPTION_PUBLIC_KEY,
];

/**
 * @typedef {(import('../../selectors/transactions').TransactionGroup} TransactionGroup
 */

/**
 * @typedef {object} TransactionDisplayData
 * @property {string} category - the transaction category that will be used for rendering the icon in the activity list
 * @property {string} primaryCurrency - the currency string to display in the primary position
 * @property {string} recipientAddress - the Ethereum address of the recipient
 * @property {string} senderAddress - the Ethereum address of the sender
 * @property {string} status - the status of the transaction
 * @property {string} subtitle - the supporting text describing the transaction
 * @property {boolean} subtitleContainsOrigin - true if the subtitle includes the origin of the tx
 * @property {string} title - the primary title of the tx that will be displayed in the activity list
 * @property {string} [secondaryCurrency] - the currency string to display in the secondary position
 */

/**
 * Get computed values used for displaying transaction data to a user
 *
 * The goal of this method is to perform all of the necessary computation and
 * state access required to take a transactionGroup and derive from it a shape
 * of data that can power all views related to a transaction. Presently the main
 * case is for shared logic between transaction-list-item and transaction-detail-view
 *
 * @param {TransactionGroup} transactionGroup - group of transactions of the same nonce
 * @returns {TransactionDisplayData}
 */
export function useTransactionDisplayData(transactionGroup) {
  // To determine which primary currency to display for swaps transactions we need to be aware
  // of which asset, if any, we are viewing at present
  const dispatch = useDispatch();
  const currentAsset = useCurrentAsset();
  const knownTokens = useSelector(getTokens);
  const knownCollectibles = useSelector(getCollectibles);
  const t = useI18nContext();

  const { initialTransaction, primaryTransaction } = transactionGroup;
  // initialTransaction contains the data we need to derive the primary purpose of this transaction group
  const { type } = initialTransaction;
  const { from: senderAddress, to } = initialTransaction.txParams || {};

  // for smart contract interactions, methodData can be used to derive the name of the action being taken
  const methodData =
    useSelector((state) =>
      getKnownMethodData(state, initialTransaction?.txParams?.data),
    ) || {};

  const displayedStatusKey = getStatusKey(primaryTransaction);
  const isPending = displayedStatusKey in PENDING_STATUS_HASH;
  const isSubmitted = displayedStatusKey === TRANSACTION_STATUSES.SUBMITTED;

  const primaryValue = primaryTransaction.txParams?.value;
  const date = formatDateWithYearContext(initialTransaction.time);

  let prefix = '-';
  let subtitle;
  let subtitleContainsOrigin = false;
  let recipientAddress = to;

  // This value is used to determine whether we should look inside txParams.data
  // to pull out and render token related information
  const isTokenCategory = TOKEN_CATEGORY_HASH[type];

  // these values are always instantiated because they are either
  // used by or returned from hooks. Hooks must be called at the top level,
  // so as an additional safeguard against inappropriately associating token
  // transfers, we pass an additional argument to these hooks that will be
  // false for non-token transactions. This additional argument forces the
  // hook to return null
  const token =
    isTokenCategory &&
    knownTokens.find(({ address }) =>
      isEqualCaseInsensitive(address, recipientAddress),
    );

  const tokenData = useTokenData(
    initialTransaction?.txParams?.data,
    isTokenCategory,
  );

  // Sometimes the tokenId value is parsed as "_value" param. Not seeing this often any more, but still occasionally:
  // i.e. call approve() on BAYC contract - https://etherscan.io/token/0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d#writeContract, and tokenId shows up as _value,
  // not sure why since it doesn't match the ERC721 ABI spec we use to parse these transactions - https://github.com/MetaMask/metamask-eth-abis/blob/d0474308a288f9252597b7c93a3a8deaad19e1b2/src/abis/abiERC721.ts#L62.
  const transactionDataTokenId =
    getTokenIdParam(tokenData) ?? getTokenValueParam(tokenData);

  const collectible =
    isTokenCategory &&
    knownCollectibles.find(
      ({ address, tokenId }) =>
        isEqualCaseInsensitive(address, recipientAddress) &&
        tokenId === transactionDataTokenId,
    );

  const tokenDisplayValue = useTokenDisplayValue(
    initialTransaction?.txParams?.data,
    token,
    isTokenCategory,
  );
  const tokenFiatAmount = useTokenFiatAmount(
    token?.address,
    tokenDisplayValue,
    token?.symbol,
  );

  const origin = stripHttpSchemes(
    initialTransaction.origin || initialTransaction.msgParams?.origin || '',
  );

  // used to append to the primary display value. initialized to either token.symbol or undefined
  // but can later be modified if dealing with a swap
  let primarySuffix = isTokenCategory ? token?.symbol : undefined;
  // used to display the primary value of tx. initialized to either tokenDisplayValue or undefined
  // but can later be modified if dealing with a swap
  let primaryDisplayValue = isTokenCategory ? tokenDisplayValue : undefined;
  // used to display fiat amount of tx. initialized to either tokenFiatAmount or undefined
  // but can later be modified if dealing with a swap
  let secondaryDisplayValue = isTokenCategory ? tokenFiatAmount : undefined;

  let category;
  let title;

  const {
    swapTokenValue,
    isNegative,
    swapTokenFiatAmount,
    isViewingReceivedTokenFromSwap,
  } = useSwappedTokenValue(transactionGroup, currentAsset);

  if (signatureTypes.includes(type)) {
    category = TRANSACTION_GROUP_CATEGORIES.SIGNATURE_REQUEST;
    title = t('signatureRequest');
    subtitle = origin;
    subtitleContainsOrigin = true;
  } else if (type === TRANSACTION_TYPES.SWAP) {
    category = TRANSACTION_GROUP_CATEGORIES.SWAP;
    title = t('swapTokenToToken', [
      initialTransaction.sourceTokenSymbol,
      initialTransaction.destinationTokenSymbol,
    ]);
    subtitle = origin;
    subtitleContainsOrigin = true;
    primarySuffix = isViewingReceivedTokenFromSwap
      ? currentAsset.symbol
      : initialTransaction.sourceTokenSymbol;
    primaryDisplayValue = swapTokenValue;
    secondaryDisplayValue = swapTokenFiatAmount;
    if (isNegative) {
      prefix = '';
    } else if (isViewingReceivedTokenFromSwap) {
      prefix = '+';
    } else {
      prefix = '-';
    }
  } else if (type === TRANSACTION_TYPES.SWAP_APPROVAL) {
    category = TRANSACTION_GROUP_CATEGORIES.APPROVAL;
    title = t('swapApproval', [primaryTransaction.sourceTokenSymbol]);
    subtitle = origin;
    subtitleContainsOrigin = true;
    primarySuffix = primaryTransaction.sourceTokenSymbol;
  } else if (type === TRANSACTION_TYPES.TOKEN_METHOD_APPROVE) {
    category = TRANSACTION_GROUP_CATEGORIES.APPROVAL;
    prefix = '';
    title = t('approveSpendLimit', [token?.symbol || t('token')]);
    subtitle = origin;
    subtitleContainsOrigin = true;
  } else if (type === TRANSACTION_TYPES.TOKEN_METHOD_SET_APPROVAL_FOR_ALL) {
    category = TRANSACTION_GROUP_CATEGORIES.APPROVAL;
    prefix = '';
    title = t('setApprovalForAllTitle', [token?.symbol || t('token')]);
    subtitle = origin;
    subtitleContainsOrigin = true;
  } else if (type === TRANSACTION_TYPES.CONTRACT_INTERACTION) {
    category = TRANSACTION_GROUP_CATEGORIES.INTERACTION;
    const transactionTypeTitle = getTransactionTypeTitle(t, type);
    title =
      (methodData?.name && camelCaseToCapitalize(methodData.name)) ||
      transactionTypeTitle;
    subtitle = origin;
    subtitleContainsOrigin = true;
  } else if (type === TRANSACTION_TYPES.DEPLOY_CONTRACT) {
    // @todo Should perhaps be a separate group?
    category = TRANSACTION_GROUP_CATEGORIES.INTERACTION;
    title = getTransactionTypeTitle(t, type);
    subtitle = origin;
    subtitleContainsOrigin = true;
  } else if (type === TRANSACTION_TYPES.INCOMING) {
    category = TRANSACTION_GROUP_CATEGORIES.RECEIVE;
    title = t('receive');
    prefix = '';
    subtitle = t('fromAddress', [shortenAddress(senderAddress)]);
  } else if (
    type === TRANSACTION_TYPES.TOKEN_METHOD_TRANSFER_FROM ||
    type === TRANSACTION_TYPES.TOKEN_METHOD_TRANSFER
  ) {
    category = TRANSACTION_GROUP_CATEGORIES.SEND;
    title = t('sendSpecifiedTokens', [
      token?.symbol || collectible?.name || t('token'),
    ]);
    recipientAddress = getTokenAddressParam(tokenData);
    subtitle = t('toAddress', [shortenAddress(recipientAddress)]);
  } else if (type === TRANSACTION_TYPES.TOKEN_METHOD_SAFE_TRANSFER_FROM) {
    category = TRANSACTION_GROUP_CATEGORIES.SEND;
    title = t('safeTransferFrom');
    recipientAddress = getTokenAddressParam(tokenData);
    subtitle = t('toAddress', [shortenAddress(recipientAddress)]);
  } else if (type === TRANSACTION_TYPES.SIMPLE_SEND) {
    category = TRANSACTION_GROUP_CATEGORIES.SEND;
    title = t('send');
    subtitle = t('toAddress', [shortenAddress(recipientAddress)]);
  } else {
    dispatch(
      captureSingleException(
        `useTransactionDisplayData does not recognize transaction type. Type received is: ${type}`,
      ),
    );
  }

  const primaryCurrencyPreferences = useUserPreferencedCurrency(PRIMARY);
  const secondaryCurrencyPreferences = useUserPreferencedCurrency(SECONDARY);

  const [primaryCurrency] = useCurrencyDisplay(primaryValue, {
    prefix,
    displayValue: primaryDisplayValue,
    suffix: primarySuffix,
    ...primaryCurrencyPreferences,
  });

  const [secondaryCurrency] = useCurrencyDisplay(primaryValue, {
    prefix,
    displayValue: secondaryDisplayValue,
    hideLabel: isTokenCategory || Boolean(swapTokenValue),
    ...secondaryCurrencyPreferences,
  });

  return {
    title,
    category,
    date,
    subtitle,
    subtitleContainsOrigin,
    primaryCurrency:
      type === TRANSACTION_TYPES.SWAP && isPending ? '' : primaryCurrency,
    senderAddress,
    recipientAddress,
    secondaryCurrency:
      (isTokenCategory && !tokenFiatAmount) ||
      (type === TRANSACTION_TYPES.SWAP && !swapTokenFiatAmount)
        ? undefined
        : secondaryCurrency,
    displayedStatusKey,
    isPending,
    isSubmitted,
  };
}
