import React from 'react';
import { screen } from '@testing-library/react';

import { EDIT_GAS_MODES } from '../../../../../shared/constants/gas';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { ETH } from '../../../../helpers/constants/common';
import configureStore from '../../../../store/store';
import { GasFeeContextProvider } from '../../../../contexts/gasFee';

import EditGasItem from './edit-gas-item';

jest.mock('../../../../store/actions', () => ({
  disconnectGasFeeEstimatePoller: jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest
    .fn()
    .mockImplementation(() => Promise.resolve()),
  addPollingTokenToAppState: jest.fn(),
  getGasFeeTimeEstimate: jest
    .fn()
    .mockImplementation(() => Promise.resolve('unknown')),
  createTransactionEventFragment: jest.fn(),
}));

const MOCK_FEE_ESTIMATE = {
  low: {
    minWaitTimeEstimate: 360000,
    maxWaitTimeEstimate: 300000,
    suggestedMaxPriorityFeePerGas: '3',
    suggestedMaxFeePerGas: '53',
  },
  medium: {
    minWaitTimeEstimate: 30000,
    maxWaitTimeEstimate: 60000,
    suggestedMaxPriorityFeePerGas: '7',
    suggestedMaxFeePerGas: '70',
  },
  high: {
    minWaitTimeEstimate: 15000,
    maxWaitTimeEstimate: 15000,
    suggestedMaxPriorityFeePerGas: '10',
    suggestedMaxFeePerGas: '100',
  },
  estimatedBaseFee: '50',
};

const ESTIMATE_MOCK = {
  maxFeePerGas: '0x59682f10',
  maxPriorityFeePerGas: '0x59682f00',
};

const renderComponent = ({
  componentProps,
  transactionProps,
  contextProps,
} = {}) => {
  const store = configureStore({
    metamask: {
      nativeCurrency: ETH,
      provider: {},
      cachedBalances: {},
      accounts: {
        '0xAddress': {
          address: '0xAddress',
          balance: '0x176e5b6f173ebe66',
        },
      },
      selectedAddress: '0xAddress',
      featureFlags: { advancedInlineGas: true },
      gasEstimateType: 'fee-market',
      gasFeeEstimates: MOCK_FEE_ESTIMATE,
      advancedGasFee: {
        maxBaseFee: '100',
        priorityFee: '2',
      },
    },
  });

  return renderWithProvider(
    <GasFeeContextProvider
      transaction={{ txParams: { gas: '0x5208' }, ...transactionProps }}
      {...contextProps}
    >
      <EditGasItem priorityLevel="low" {...componentProps} />
    </GasFeeContextProvider>,
    store,
  );
};

describe('EditGasItem', () => {
  it('should renders low gas estimate option for priorityLevel low', () => {
    renderComponent({ componentProps: { priorityLevel: 'low' } });
    expect(screen.queryByRole('button', { name: 'low' })).toBeInTheDocument();
    expect(screen.queryByText('🐢')).toBeInTheDocument();
    expect(screen.queryByText('Low')).toBeInTheDocument();
    expect(screen.queryByText('5 min')).toBeInTheDocument();
    expect(screen.queryByTitle('0.001113 ETH')).toBeInTheDocument();
  });

  it('should renders market gas estimate option for priorityLevel medium', () => {
    renderComponent({ componentProps: { priorityLevel: 'medium' } });
    expect(
      screen.queryByRole('button', { name: 'medium' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('🦊')).toBeInTheDocument();
    expect(screen.queryByText('Market')).toBeInTheDocument();
    expect(screen.queryByText('5 min')).toBeInTheDocument();
    expect(screen.queryByTitle('0.00147 ETH')).toBeInTheDocument();
  });

  it('should renders aggressive gas estimate option for priorityLevel high', () => {
    renderComponent({ componentProps: { priorityLevel: 'high' } });
    expect(screen.queryByRole('button', { name: 'high' })).toBeInTheDocument();
    expect(screen.queryByText('🦍')).toBeInTheDocument();
    expect(screen.queryByText('Aggressive')).toBeInTheDocument();
    expect(screen.queryByText('15 sec')).toBeInTheDocument();
    expect(screen.queryByTitle('0.0021 ETH')).toBeInTheDocument();
  });

  it('should render priorityLevel high as "Swap suggested" for swaps', () => {
    renderComponent({
      componentProps: { priorityLevel: 'high' },
      contextProps: { editGasMode: EDIT_GAS_MODES.SWAPS },
    });
    expect(screen.queryByRole('button', { name: 'high' })).toBeInTheDocument();
    expect(screen.queryByText('🔄')).toBeInTheDocument();
    expect(screen.queryByText('Swap suggested')).toBeInTheDocument();
    expect(screen.queryByText('15 sec')).not.toBeInTheDocument();
    expect(screen.queryByTitle('0.0021 ETH')).toBeInTheDocument();
  });

  it('should highlight option is priorityLevel is currently selected', () => {
    renderComponent({
      componentProps: { priorityLevel: 'high' },
      transactionProps: { userFeeLevel: 'high' },
    });
    expect(
      document.getElementsByClassName('edit-gas-item--selected'),
    ).toHaveLength(1);
  });

  it('should renders site gas estimate option for priorityLevel dappSuggested', () => {
    renderComponent({
      componentProps: { priorityLevel: 'dappSuggested' },
      transactionProps: { dappSuggestedGasFees: ESTIMATE_MOCK },
    });
    expect(
      screen.queryByRole('button', { name: 'dappSuggested' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('🌐')).toBeInTheDocument();
    expect(screen.queryByText('Site')).toBeInTheDocument();
    expect(screen.queryByTitle('0.0000315 ETH')).toBeInTheDocument();
  });

  it('should not renders site gas estimate option for priorityLevel dappSuggested if site does not provided gas estimates', () => {
    renderComponent({
      componentProps: { priorityLevel: 'dappSuggested' },
      transactionProps: {},
    });
    expect(
      screen.queryByRole('button', { name: 'dappSuggested' }),
    ).not.toBeInTheDocument();
    renderComponent({
      componentProps: { priorityLevel: 'dappSuggested' },
      transactionProps: { dappSuggestedGasFees: { gas: '0x59682f10' } },
    });
    expect(
      screen.queryByRole('button', { name: 'dappSuggested' }),
    ).not.toBeInTheDocument();
  });

  it('should renders advance gas estimate option for priorityLevel custom', () => {
    renderComponent({
      componentProps: { priorityLevel: 'custom' },
      transactionProps: { userFeeLevel: 'high' },
    });
    expect(
      screen.queryByRole('button', { name: 'custom' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('⚙️')).toBeInTheDocument();
    expect(screen.queryByText('Advanced')).toBeInTheDocument();
    // below value of custom gas fee estimate is default obtained from state.metamask.advancedGasFee
    expect(screen.queryByTitle('0.0021 ETH')).toBeInTheDocument();
  });

  it('should renders +10% gas estimate option for priorityLevel minimum', () => {
    renderComponent({
      componentProps: { priorityLevel: 'tenPercentIncreased' },
      transactionProps: {
        userFeeLevel: 'tenPercentIncreased',
        previousGas: ESTIMATE_MOCK,
      },
      contextProps: { editGasMode: EDIT_GAS_MODES.CANCEL },
    });
    expect(
      screen.queryByRole('button', { name: 'tenPercentIncreased' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('10% increase')).toBeInTheDocument();
    expect(screen.queryByTitle('0.00003465 ETH')).toBeInTheDocument();
  });
});
