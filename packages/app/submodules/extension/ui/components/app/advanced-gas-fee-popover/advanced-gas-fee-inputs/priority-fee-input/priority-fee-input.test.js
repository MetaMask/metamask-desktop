import React from 'react';
import { fireEvent, screen } from '@testing-library/react';

import {
  EDIT_GAS_MODES,
  GAS_ESTIMATE_TYPES,
} from '../../../../../../shared/constants/gas';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import mockEstimates from '../../../../../../test/data/mock-estimates.json';
import mockState from '../../../../../../test/data/mock-state.json';
import { GasFeeContextProvider } from '../../../../../contexts/gasFee';
import configureStore from '../../../../../store/store';

import { AdvancedGasFeePopoverContextProvider } from '../../context';
import AdvancedGasFeeGasLimit from '../../advanced-gas-fee-gas-limit';
import PriorityfeeInput from './priority-fee-input';

jest.mock('../../../../../store/actions', () => ({
  disconnectGasFeeEstimatePoller: jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest
    .fn()
    .mockImplementation(() => Promise.resolve()),
  addPollingTokenToAppState: jest.fn(),
  removePollingTokenFromAppState: jest.fn(),
}));

const render = (txProps, contextProps) => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
      accounts: {
        [mockState.metamask.selectedAddress]: {
          address: mockState.metamask.selectedAddress,
          balance: '0x1F4',
        },
      },
      advancedGasFee: { priorityFee: 100 },
      featureFlags: { advancedInlineGas: true },
      gasFeeEstimates:
        mockEstimates[GAS_ESTIMATE_TYPES.FEE_MARKET].gasFeeEstimates,
    },
  });

  return renderWithProvider(
    <GasFeeContextProvider
      transaction={{
        userFeeLevel: 'custom',
        ...txProps,
      }}
      {...contextProps}
    >
      <AdvancedGasFeePopoverContextProvider>
        <PriorityfeeInput />
        <AdvancedGasFeeGasLimit />
      </AdvancedGasFeePopoverContextProvider>
    </GasFeeContextProvider>,
    store,
  );
};

describe('PriorityfeeInput', () => {
  it('should renders advancedGasFee.priorityfee value if current estimate used is not custom', () => {
    render({
      userFeeLevel: 'high',
    });
    expect(document.getElementsByTagName('input')[0]).toHaveValue(100);
  });

  it('should not use advancedGasFee.priorityfee value for swaps', () => {
    render(
      {
        userFeeLevel: 'high',
      },
      { editGasMode: EDIT_GAS_MODES.SWAPS },
    );
    expect(document.getElementsByTagName('input')[0]).toHaveValue(
      parseInt(
        mockEstimates[GAS_ESTIMATE_TYPES.FEE_MARKET].gasFeeEstimates.high
          .suggestedMaxPriorityFeePerGas,
        10,
      ),
    );
  });

  it('should renders priorityfee value from transaction if current estimate used is custom', () => {
    render({
      txParams: {
        maxPriorityFeePerGas: '0x77359400',
      },
    });
    expect(document.getElementsByTagName('input')[0]).toHaveValue(2);
  });

  it('should show current priority fee range in subtext', () => {
    render();
    expect(screen.queryByText('1 - 20 GWEI')).toBeInTheDocument();
  });

  it('should show current value of priority fee in users primary currency in right side of input box', () => {
    render({
      txParams: {
        gas: '0x5208',
        maxPriorityFeePerGas: '0x77359400',
      },
    });
    expect(screen.queryByText('≈ 0.000042 ETH')).toBeInTheDocument();
  });

  it('should show 12hr range value in subtext', () => {
    render();
    expect(screen.queryByText('2 - 125 GWEI')).toBeInTheDocument();
  });

  it('should show error if value entered is 0', () => {
    render({
      txParams: {
        maxPriorityFeePerGas: '0x174876E800',
      },
    });
    expect(
      screen.queryByText('Priority fee must be greater than 0.'),
    ).not.toBeInTheDocument();
    fireEvent.change(document.getElementsByTagName('input')[0], {
      target: { value: 0 },
    });
    expect(
      screen.queryByText('Priority fee must be greater than 0.'),
    ).toBeInTheDocument();
  });
});
