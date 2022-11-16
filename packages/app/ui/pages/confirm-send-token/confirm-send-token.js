import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import ConfirmTokenTransactionBase from '../confirm-token-transaction-base/confirm-token-transaction-base';
import { SEND_ROUTE } from '../../helpers/constants/routes';
import { editExistingTransaction } from '../../ducks/send';
import {
  contractExchangeRateSelector,
  getCurrentCurrency,
} from '../../selectors';
import {
  getConversionRate,
  getNativeCurrency,
} from '../../ducks/metamask/metamask';
import { clearConfirmTransaction } from '../../ducks/confirm-transaction/confirm-transaction.duck';
import { showSendTokenPage } from '../../store/actions';
import {
  ASSET_TYPES,
  ERC20,
  ERC721,
} from '../../../shared/constants/transaction';

export default function ConfirmSendToken({
  assetStandard,
  toAddress,
  tokenAddress,
  assetName,
  tokenSymbol,
  tokenAmount,
  tokenId,
  transaction,
  image,
  ethTransactionTotal,
  fiatTransactionTotal,
  hexMaximumTransactionFee,
}) {
  const dispatch = useDispatch();
  const history = useHistory();

  const handleEditTransaction = async ({ txData }) => {
    const { id } = txData;
    await dispatch(editExistingTransaction(ASSET_TYPES.TOKEN, id.toString()));
    dispatch(clearConfirmTransaction());
    dispatch(showSendTokenPage());
  };

  const handleEdit = (confirmTransactionData) => {
    handleEditTransaction(confirmTransactionData).then(() => {
      history.push(SEND_ROUTE);
    });
  };
  const conversionRate = useSelector(getConversionRate);
  const nativeCurrency = useSelector(getNativeCurrency);
  const currentCurrency = useSelector(getCurrentCurrency);
  const contractExchangeRate = useSelector(contractExchangeRateSelector);

  let title, subtitle;

  if (assetStandard === ERC721) {
    title = assetName;
    subtitle = `#${tokenId}`;
  } else if (assetStandard === ERC20) {
    title = `${tokenAmount} ${tokenSymbol}`;
  }

  return (
    <ConfirmTokenTransactionBase
      onEdit={handleEdit}
      conversionRate={conversionRate}
      currentCurrency={currentCurrency}
      nativeCurrency={nativeCurrency}
      contractExchangeRate={contractExchangeRate}
      title={title}
      subtitle={subtitle}
      assetStandard={assetStandard}
      assetName={assetName}
      tokenSymbol={tokenSymbol}
      tokenAmount={tokenAmount}
      tokenId={tokenId}
      transaction={transaction}
      image={image}
      toAddress={toAddress}
      tokenAddress={tokenAddress}
      ethTransactionTotal={ethTransactionTotal}
      fiatTransactionTotal={fiatTransactionTotal}
      hexMaximumTransactionFee={hexMaximumTransactionFee}
    />
  );
}

ConfirmSendToken.propTypes = {
  tokenAmount: PropTypes.string,
  assetStandard: PropTypes.string,
  assetName: PropTypes.string,
  tokenSymbol: PropTypes.string,
  image: PropTypes.string,
  tokenId: PropTypes.string,
  toAddress: PropTypes.string,
  tokenAddress: PropTypes.string,
  transaction: PropTypes.shape({
    origin: PropTypes.string,
    txParams: PropTypes.shape({
      data: PropTypes.string,
      to: PropTypes.string,
      from: PropTypes.string,
    }),
  }),
  ethTransactionTotal: PropTypes.string,
  fiatTransactionTotal: PropTypes.string,
  hexMaximumTransactionFee: PropTypes.string,
};
