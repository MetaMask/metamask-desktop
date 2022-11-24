import React from 'react';
import README from './README.mdx';
import PulseLoader from '.';

export default {
  title: 'Components/UI/PulseLoader',
  id: __filename,
  component: PulseLoader,
  parameters: {
    docs: {
      page: README,
    },
  },
};

export const DefaultStory = () => <PulseLoader />;

DefaultStory.storyName = 'Default';
