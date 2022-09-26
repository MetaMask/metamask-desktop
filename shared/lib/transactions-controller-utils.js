import BigNumber from 'bignumber.js';
import { TRANSACTION_ENVELOPE_TYPES } from '../constants/transaction';
import {
  conversionUtil,
  multiplyCurrencies,
  subtractCurrencies,
} from '../modules/conversion.utils';
import { isSwapsDefaultTokenSymbol } from '../modules/swaps.utils';

const TOKEN_TRANSFER_LOG_TOPIC_HASH =
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

export const TRANSACTION_NO_CONTRACT_ERROR_KEY = 'transactionErrorNoContract';

export const TEN_SECONDS_IN_MILLISECONDS = 10_000;

export function calcGasTotal(gasLimit = '0', gasPrice = '0') {
  return multiplyCurrencies(gasLimit, gasPrice, {
    toNumericBase: 'hex',
    multiplicandBase: 16,
    multiplierBase: 16,
  });
}

/**
 * Given a number and specified precision, returns that number in base 10 with a maximum of precision
 * significant digits, but without any trailing zeros after the decimal point To be used when wishing
 * to display only as much digits to the user as necessary
 *
 * @param {string | number | BigNumber} n - The number to format
 * @param {number} precision - The maximum number of significant digits in the return value
 * @returns {string} The number in decimal form, with <= precision significant digits and no decimal trailing zeros
 */
export function toPrecisionWithoutTrailingZeros(n, precision) {
  return new BigNumber(n)
    .toPrecision(precision)
    .replace(/(\.[0-9]*[1-9])0*|(\.0*)/u, '$1');
}

export function calcTokenAmount(value, decimals) {
  const multiplier = Math.pow(10, Number(decimals || 0));
  return new BigNumber(String(value)).div(multiplier);
}

export function getSwapsTokensReceivedFromTxMeta(
  tokenSymbol,
  txMeta,
  tokenAddress,
  accountAddress,
  tokenDecimals,
  approvalTxMeta,
  chainId,
) {
  const txReceipt = txMeta?.txReceipt;
  const networkAndAccountSupports1559 =
    txMeta?.txReceipt?.type === TRANSACTION_ENVELOPE_TYPES.FEE_MARKET;
  if (isSwapsDefaultTokenSymbol(tokenSymbol, chainId)) {
    if (
      !txReceipt ||
      !txMeta ||
      !txMeta.postTxBalance ||
      !txMeta.preTxBalance
    ) {
      return null;
    }

    if (txMeta.swapMetaData && txMeta.preTxBalance === txMeta.postTxBalance) {
      // If preTxBalance and postTxBalance are equal, postTxBalance hasn't been updated on time
      // because of the RPC provider delay, so we return an estimated receiving amount instead.
      return txMeta.swapMetaData.token_to_amount;
    }

    let approvalTxGasCost = '0x0';
    if (approvalTxMeta && approvalTxMeta.txReceipt) {
      approvalTxGasCost = calcGasTotal(
        approvalTxMeta.txReceipt.gasUsed,
        networkAndAccountSupports1559
          ? approvalTxMeta.txReceipt.effectiveGasPrice // Base fee + priority fee.
          : approvalTxMeta.txParams.gasPrice,
      );
    }

    const gasCost = calcGasTotal(
      txReceipt.gasUsed,
      networkAndAccountSupports1559
        ? txReceipt.effectiveGasPrice
        : txMeta.txParams.gasPrice,
    );
    const totalGasCost = new BigNumber(gasCost, 16)
      .plus(approvalTxGasCost, 16)
      .toString(16);

    const preTxBalanceLessGasCost = subtractCurrencies(
      txMeta.preTxBalance,
      totalGasCost,
      {
        aBase: 16,
        bBase: 16,
        toNumericBase: 'hex',
      },
    );

    const ethReceived = subtractCurrencies(
      txMeta.postTxBalance,
      preTxBalanceLessGasCost,
      {
        aBase: 16,
        bBase: 16,
        fromDenomination: 'WEI',
        toDenomination: 'ETH',
        toNumericBase: 'dec',
        numberOfDecimals: 6,
      },
    );
    return ethReceived;
  }
  const txReceiptLogs = txReceipt?.logs;
  if (txReceiptLogs && txReceipt?.status !== '0x0') {
    const tokenTransferLog = txReceiptLogs.find((txReceiptLog) => {
      const isTokenTransfer =
        txReceiptLog.topics &&
        txReceiptLog.topics[0] === TOKEN_TRANSFER_LOG_TOPIC_HASH;
      const isTransferFromGivenToken = txReceiptLog.address === tokenAddress;
      const isTransferFromGivenAddress =
        txReceiptLog.topics &&
        txReceiptLog.topics[2] &&
        txReceiptLog.topics[2].match(accountAddress.slice(2));
      return (
        isTokenTransfer &&
        isTransferFromGivenToken &&
        isTransferFromGivenAddress
      );
    });
    return tokenTransferLog
      ? toPrecisionWithoutTrailingZeros(
          calcTokenAmount(tokenTransferLog.data, tokenDecimals).toString(10),
          6,
        )
      : '';
  }
  return null;
}

export const TRANSACTION_ENVELOPE_TYPE_NAMES = {
  FEE_MARKET: 'fee-market',
  LEGACY: 'legacy',
};

export function hexWEIToDecGWEI(decGWEI) {
  return conversionUtil(decGWEI, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    toDenomination: 'GWEI',
  });
}

export function decimalToHex(decimal) {
  return conversionUtil(decimal, {
    fromNumericBase: 'dec',
    toNumericBase: 'hex',
  });
}

export function hexWEIToDecETH(hexWEI) {
  return conversionUtil(hexWEI, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    toDenomination: 'ETH',
  });
}
