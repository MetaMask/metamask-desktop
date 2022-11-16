import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useGasFeeContext } from '../contexts/gasFee';
import {
  createTransactionEventFragment,
  updateEventFragment,
} from '../store/actions';
import { selectMatchingFragment } from '../selectors';
import { TRANSACTION_EVENTS } from '../../shared/constants/transaction';

export const useTransactionEventFragment = () => {
  const { transaction } = useGasFeeContext();
  const fragment = useSelector((state) =>
    selectMatchingFragment(state, {
      fragmentOptions: {},
      existingId: `transaction-added-${transaction?.id}`,
    }),
  );

  const updateTransactionEventFragment = useCallback(
    async (params) => {
      if (!transaction || !transaction.id) {
        return;
      }
      if (!fragment) {
        await createTransactionEventFragment(
          transaction.id,
          TRANSACTION_EVENTS.APPROVED,
        );
      }
      updateEventFragment(`transaction-added-${transaction.id}`, params);
    },
    [fragment, transaction],
  );

  return {
    updateTransactionEventFragment,
  };
};
