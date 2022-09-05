import React from 'react';
import configureMockStore from 'redux-mock-store';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import SignatureRequestOriginal from '.';

const MOCK_SIGN_DATA = JSON.stringify({
  domain: {
    name: 'happydapp.website',
  },
  message: {
    string: 'haay wuurl',
    number: 42,
  },
  primaryType: 'Mail',
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
    Group: [
      { name: 'name', type: 'string' },
      { name: 'members', type: 'Person[]' },
    ],
    Mail: [
      { name: 'from', type: 'Person' },
      { name: 'to', type: 'Person[]' },
      { name: 'contents', type: 'string' },
    ],
    Person: [
      { name: 'name', type: 'string' },
      { name: 'wallets', type: 'address[]' },
    ],
  },
});

describe('SignatureRequestOriginal', () => {
  const store = configureMockStore()(mockState);

  it('should match snapshot', () => {
    const props = {
      signMessage: jest.fn(),
      cancelMessage: jest.fn(),
      txData: {
        msgParams: {
          from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
          data: MOCK_SIGN_DATA,
          origin: 'https://happydapp.website/governance?futarchy=true',
        },
        type: MESSAGE_TYPE.ETH_SIGN,
      },
    };

    const { container } = renderWithProvider(
      <SignatureRequestOriginal {...props} />,
      store,
    );

    expect(container).toMatchSnapshot();
  });
});
