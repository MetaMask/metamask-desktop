import * as React from 'react';
import { renderWithProvider, screen, fireEvent } from '../../../../test/jest';
import configureStore from '../../../store/store';
import testData from '../../../../.storybook/test-data';

import DetectedToken from './detected-token';

describe('DetectedToken', () => {
  it('should render the detected token found page', async () => {
    const store = configureStore(testData);
    const props = {
      setShowDetectedTokens: jest.fn(),
    };

    renderWithProvider(<DetectedToken {...props} />, store);

    expect(screen.getByText('0 LINK')).toBeInTheDocument();
    expect(screen.getByText('0 COMP')).toBeInTheDocument();
    expect(screen.getByText('0 FSW')).toBeInTheDocument();
    expect(screen.getAllByText('$0')).toHaveLength(3);
    expect(screen.getAllByText('Token address:')).toHaveLength(3);
    expect(screen.getByText('0x514...86CA')).toBeInTheDocument();
    expect(screen.getByText('0xc00...6888')).toBeInTheDocument();
    expect(screen.getByText('0xfff...26DB')).toBeInTheDocument();
    expect(screen.getAllByText('From token lists:')).toHaveLength(3);
    expect(screen.getByText('Aave, Bancor')).toBeInTheDocument();
    expect(screen.getByText('+ 9 more')).toBeInTheDocument();
    fireEvent.click(screen.getByText('+ 9 more'));
    expect(
      screen.getByText(
        'Aave, Bancor, CMC, Crypto.com, CoinGecko, 1inch, Paraswap, PMM, Zapper, Zerion, 0x.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Bancor, CMC')).toBeInTheDocument();
    expect(screen.getByText('+ 8 more')).toBeInTheDocument();
    fireEvent.click(screen.getByText('+ 8 more'));
    expect(
      screen.getByText(
        'Bancor, CMC, Crypto.com, CoinGecko, 1inch, Paraswap, PMM, Zapper, Zerion, 0x.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('CoinGecko, 1inch')).toBeInTheDocument();
    expect(screen.getByText('+ 1 more')).toBeInTheDocument();
    fireEvent.click(screen.getByText('+ 1 more'));
    expect(screen.getByText('CoinGecko, 1inch, Lifi.')).toBeInTheDocument();
  });
});
