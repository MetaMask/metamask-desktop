import React from 'react';

import SendFooter from './send-footer.component';

export default {
  title: 'Pages/Send/SendFooter',
  id: __filename,
  argTypes: {
    clearSend: { action: 'clearSend' },
    sign: { action: 'sign' },
    from: { control: 'object' },
    disabled: { control: 'boolean' },
    mostRecentOverviewPage: { control: 'text' },
    sendErrors: { control: 'object' },
    history: { action: 'history' },
    addToAddressBookIfNew: { action: 'addToAddressBookIfNew' },
    resetSendState: { action: 'resetSendState' },
  },
};

export const DefaultStory = (args) => {
  return <SendFooter {...args} />;
};

DefaultStory.storyName = 'Default';
DefaultStory.args = {
  from: {
    address: '',
  },
  disabled: false,
  mostRecentOverviewPage: '',
  sendErrors: {},
};
