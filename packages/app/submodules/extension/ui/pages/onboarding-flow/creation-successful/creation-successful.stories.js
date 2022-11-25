import React from 'react';
import CreationSuccessful from './creation-successful';

export default {
  title: 'Pages/OnboardingFlow/CreationSuccessful',
  id: __filename,
};

export const DefaultStory = () => {
  return (
    <div style={{ maxHeight: '2000px' }}>
      <CreationSuccessful />
    </div>
  );
};

DefaultStory.storyName = 'Default';
