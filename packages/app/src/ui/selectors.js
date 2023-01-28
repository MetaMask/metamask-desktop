import { TEMPLATED_CONFIRMATION_MESSAGE_TYPES } from '../submodules/extension/ui/pages/confirmation/templates';
import { createSelector } from 'reselect';
import { transactionMatchesNetwork } from '../submodules/extension/shared/modules/transaction.utils';

export function getUnapprovedConfirmations(state) {
  const { pendingApprovals } = state.metamask;
  return Object.values(pendingApprovals);
}

export function getUnapprovedTemplatedConfirmations(state) {
  const unapprovedConfirmations = getUnapprovedConfirmations(state);
  return unapprovedConfirmations.filter((approval) =>
    TEMPLATED_CONFIRMATION_MESSAGE_TYPES.includes(approval.type),
  );
}

///: BEGIN:ONLY_INCLUDE_IN(flask)
export function getSnapInstallOrUpdateRequests(state) {
  return Object.values(state.metamask.pendingApprovals)
    .filter(
      ({ type }) =>
        type === 'wallet_installSnap' || type === 'wallet_updateSnap',
    )
    .map(({ requestData }) => requestData);
}

export function getFirstSnapInstallOrUpdateRequest(state) {
  return getSnapInstallOrUpdateRequests(state)?.[0] ?? null;
}
///: END:ONLY_INCLUDE_IN

export function getPermissionsRequests(state) {
  return Object.values(state.metamask.pendingApprovals)
    .filter(({ type }) => type === 'wallet_requestPermissions')
    .map(({ requestData }) => requestData);
}

export function getFirstPermissionRequest(state) {
  const requests = getPermissionsRequests(state);
  return requests && requests[0] ? requests[0] : null;
}

export function getFirstPermissionRequestId(state) {
  let firstPermissionsRequest, firstPermissionsRequestId;
  firstPermissionsRequest = getFirstPermissionRequest(state);
  firstPermissionsRequestId = firstPermissionsRequest?.metadata.id || null;

  // getFirstPermissionRequest should be updated with snap update logic once we hit main extension release

  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  if (!firstPermissionsRequest) {
    firstPermissionsRequest = getFirstSnapInstallOrUpdateRequest(state);
    firstPermissionsRequestId = firstPermissionsRequest?.metadata.id || null;
  }
  ///: END:ONLY_INCLUDE_IN

  return firstPermissionsRequestId;
}

const unapprovedTxsSelector = (state) => state.metamask.unapprovedTxs;
const unapprovedMsgCountSelector = (state) => state.metamask.unapprovedMsgCount;
const unapprovedPersonalMsgCountSelector = (state) =>
  state.metamask.unapprovedPersonalMsgCount;
const unapprovedDecryptMsgCountSelector = (state) =>
  state.metamask.unapprovedDecryptMsgCount;
const unapprovedEncryptionPublicKeyMsgCountSelector = (state) =>
  state.metamask.unapprovedEncryptionPublicKeyMsgCount;
const unapprovedTypedMessagesCountSelector = (state) =>
  state.metamask.unapprovedTypedMessagesCount;
function deprecatedGetCurrentNetworkId(state) {
  return state.metamask.network;
}

function getCurrentChainId(state) {
  return state.metamask.provider?.chainId;
}

export const unconfirmedTransactionsCountSelector = createSelector(
  unapprovedTxsSelector,
  unapprovedMsgCountSelector,
  unapprovedPersonalMsgCountSelector,
  unapprovedDecryptMsgCountSelector,
  unapprovedEncryptionPublicKeyMsgCountSelector,
  unapprovedTypedMessagesCountSelector,
  deprecatedGetCurrentNetworkId,
  getCurrentChainId,
  (
    unapprovedTxs = {},
    unapprovedMsgCount = 0,
    unapprovedPersonalMsgCount = 0,
    unapprovedDecryptMsgCount = 0,
    unapprovedEncryptionPublicKeyMsgCount = 0,
    unapprovedTypedMessagesCount = 0,
    network,
    chainId,
  ) => {
    const filteredUnapprovedTxIds = Object.keys(unapprovedTxs).filter((txId) =>
      transactionMatchesNetwork(unapprovedTxs[txId], chainId, network),
    );

    return (
      filteredUnapprovedTxIds.length +
      unapprovedTypedMessagesCount +
      unapprovedMsgCount +
      unapprovedPersonalMsgCount +
      unapprovedDecryptMsgCount +
      unapprovedEncryptionPublicKeyMsgCount
    );
  },
);
