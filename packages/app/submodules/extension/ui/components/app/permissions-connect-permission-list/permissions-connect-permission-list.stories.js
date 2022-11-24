import React from 'react';

import PermissionsConnectList from '.';

export default {
  title: 'Components/App/PermissionsConnectList',
  id: __filename,
  component: PermissionsConnectList,
  argTypes: {
    permissions: {
      control: 'object',
    },
  },
};

export const DefaultStory = (args) => <PermissionsConnectList {...args} />;

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  permissions: {
    eth_accounts: true,
  },
};
