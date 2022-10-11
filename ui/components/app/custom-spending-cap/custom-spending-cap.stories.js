import React from 'react';
import CustomSpendingCap from './custom-spending-cap';

export default {
  title: 'Components/App/CustomSpendingCap',
  id: __filename,
  argTypes: {
    tokenName: {
      control: { type: 'text' },
    },
    currentTokenBalance: {
      control: { type: 'number' },
    },
    dappProposedValue: {
      control: { type: 'number' },
    },
    siteOrigin: {
      control: { type: 'text' },
    },
    onEdit: {
      action: 'onEdit',
    },
  },
  args: {
    tokenName: 'DAI',
    currentTokenBalance: 200.12,
    dappProposedValue: 7,
    siteOrigin: 'Uniswap.org',
  },
};

export const DefaultStory = (args) => {
  return <CustomSpendingCap {...args} />;
};

DefaultStory.storyName = 'Default';
