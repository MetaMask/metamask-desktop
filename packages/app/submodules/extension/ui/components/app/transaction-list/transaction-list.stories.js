/* eslint-disable react/prop-types */
import React from 'react';
import TransactionList from '.';

export default {
  title: 'Components/App/TransactionList',
  id: __filename,
};

const PageSet = ({ children }) => {
  return children;
};

export const DefaultStory = () => {
  return (
    <PageSet>
      <TransactionList />
    </PageSet>
  );
};

DefaultStory.storyName = 'Default';
