import { useSelector } from 'react-redux';

import { GAS_ESTIMATE_TYPES } from '../../../shared/constants/gas';
import {
  conversionUtil,
  multiplyCurrencies,
} from '../../../shared/modules/conversion.utils';
import {
  getConversionRate,
  getNativeCurrency,
} from '../../ducks/metamask/metamask';
import {
  checkNetworkAndAccountSupports1559,
  getCurrentCurrency,
  getEIP1559V2Enabled,
  getSelectedAccount,
  getShouldShowFiat,
  getPreferences,
  txDataSelector,
  getCurrentKeyring,
  getTokenExchangeRates,
} from '../../selectors';
import { ETH } from '../../helpers/constants/common';

import { useGasFeeEstimates } from '../useGasFeeEstimates';
import {
  getCustomMaxFeePerGas,
  getCustomMaxPriorityFeePerGas,
} from '../../ducks/swaps/swaps';

// Why this number?
// 20 gwei * 21000 gasLimit = 420,000 gwei
// 420,000 gwei is 0.00042 ETH
// 0.00042 ETH * 100000 = $42
export const MOCK_ETH_USD_CONVERSION_RATE = 100000;

export const LEGACY_GAS_ESTIMATE_RETURN_VALUE = {
  gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
  gasFeeEstimates: {
    low: '10',
    medium: '20',
    high: '30',
  },
  estimatedGasFeeTimeBounds: {},
};

export const FEE_MARKET_ESTIMATE_RETURN_VALUE = {
  gasEstimateType: GAS_ESTIMATE_TYPES.FEE_MARKET,
  gasFeeEstimates: {
    low: {
      minWaitTimeEstimate: 180000,
      maxWaitTimeEstimate: 300000,
      suggestedMaxPriorityFeePerGas: '3',
      suggestedMaxFeePerGas: '53',
    },
    medium: {
      minWaitTimeEstimate: 15000,
      maxWaitTimeEstimate: 60000,
      suggestedMaxPriorityFeePerGas: '7',
      suggestedMaxFeePerGas: '70',
    },
    high: {
      minWaitTimeEstimate: 0,
      maxWaitTimeEstimate: 15000,
      suggestedMaxPriorityFeePerGas: '10',
      suggestedMaxFeePerGas: '100',
    },
    estimatedBaseFee: '50',
  },
  estimatedGasFeeTimeBounds: {},
};

export const HIGH_FEE_MARKET_ESTIMATE_RETURN_VALUE = {
  gasEstimateType: GAS_ESTIMATE_TYPES.FEE_MARKET,
  gasFeeEstimates: {
    low: {
      minWaitTimeEstimate: 180000,
      maxWaitTimeEstimate: 300000,
      suggestedMaxPriorityFeePerGas: '3',
      suggestedMaxFeePerGas: '53000',
    },
    medium: {
      minWaitTimeEstimate: 15000,
      maxWaitTimeEstimate: 60000,
      suggestedMaxPriorityFeePerGas: '7',
      suggestedMaxFeePerGas: '70000',
    },
    high: {
      minWaitTimeEstimate: 0,
      maxWaitTimeEstimate: 15000,
      suggestedMaxPriorityFeePerGas: '10',
      suggestedMaxFeePerGas: '100000',
    },
    estimatedBaseFee: '50000',
  },
  estimatedGasFeeTimeBounds: {},
};

export const generateUseSelectorRouter =
  ({
    checkNetworkAndAccountSupports1559Response,
    shouldShowFiat = true,
    eip1559V2Enabled = false,
  } = {}) =>
  (selector) => {
    if (selector === getConversionRate) {
      return MOCK_ETH_USD_CONVERSION_RATE;
    }
    if (selector === getNativeCurrency) {
      return ETH;
    }
    if (selector === getPreferences) {
      return {
        useNativeCurrencyAsPrimaryCurrency: true,
      };
    }
    if (selector === getCurrentCurrency) {
      return 'USD';
    }
    if (selector === getShouldShowFiat) {
      return shouldShowFiat;
    }
    if (selector === txDataSelector) {
      return {
        txParams: {
          value: '0x5555',
        },
      };
    }
    if (selector === getSelectedAccount) {
      return {
        balance: '0x440aa47cc2556',
      };
    }
    if (selector === getCustomMaxFeePerGas) {
      return '0x5208';
    }
    if (selector === getCustomMaxPriorityFeePerGas) {
      return '0x5208';
    }
    if (selector === checkNetworkAndAccountSupports1559) {
      return checkNetworkAndAccountSupports1559Response;
    }
    if (selector === getEIP1559V2Enabled) {
      return eip1559V2Enabled;
    }
    if (selector === getCurrentKeyring) {
      return { type: '' };
    }
    if (selector === getTokenExchangeRates) {
      return { '0x1': '1' };
    }
    return undefined;
  };

export function getTotalCostInETH(gwei, gasLimit) {
  return multiplyCurrencies(gwei, gasLimit, {
    fromDenomination: 'GWEI',
    toDenomination: 'ETH',
    multiplicandBase: 10,
    multiplierBase: 10,
  });
}

export function convertFromHexToFiat(value) {
  const val = conversionUtil(value, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
  });
  return `$${(val * MOCK_ETH_USD_CONVERSION_RATE).toFixed(2)}`;
}

export function convertFromHexToETH(value) {
  const val = conversionUtil(value, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
  });
  return `${val} ETH`;
}

export const configureEIP1559 = () => {
  useGasFeeEstimates.mockImplementation(() => FEE_MARKET_ESTIMATE_RETURN_VALUE);
  useSelector.mockImplementation(
    generateUseSelectorRouter({
      checkNetworkAndAccountSupports1559Response: true,
    }),
  );
};

export const configureLegacy = () => {
  useGasFeeEstimates.mockImplementation(() => LEGACY_GAS_ESTIMATE_RETURN_VALUE);
  useSelector.mockImplementation(
    generateUseSelectorRouter({
      checkNetworkAndAccountSupports1559Response: false,
    }),
  );
};

export const configure = () => {
  useSelector.mockImplementation(generateUseSelectorRouter());
};
