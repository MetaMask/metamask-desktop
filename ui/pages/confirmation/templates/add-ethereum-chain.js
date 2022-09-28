import { ethErrors } from 'eth-rpc-errors';
import React from 'react';
import { infuraProjectId } from '../../../../shared/constants/network';
import {
  SEVERITIES,
  TYPOGRAPHY,
  TEXT_ALIGN,
  JUSTIFY_CONTENT,
  DISPLAY,
  COLORS,
  FLEX_DIRECTION,
  ALIGN_ITEMS,
} from '../../../helpers/constants/design-system';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import fetchWithCache from '../../../../shared/lib/fetch-with-cache';

const UNRECOGNIZED_CHAIN = {
  id: 'UNRECOGNIZED_CHAIN',
  severity: SEVERITIES.WARNING,
  content: {
    element: 'span',
    children: {
      element: 'MetaMaskTranslation',
      props: {
        translationKey: 'unrecognizedChain',
      },
    },
  },
};

const MISMATCHED_CHAIN_RECOMMENDATION = {
  id: 'MISMATCHED_CHAIN_RECOMMENDATION',
  content: {
    element: 'span',
    children: {
      element: 'MetaMaskTranslation',
      props: {
        translationKey: 'mismatchedChainRecommendation',
        variables: [
          {
            element: 'a',
            key: 'mismatchedChainLink',
            props: {
              href: ZENDESK_URLS.VERIFY_CUSTOM_NETWORK,
              target: '__blank',
              tabIndex: 0,
            },
            children: {
              element: 'MetaMaskTranslation',
              props: {
                translationKey: 'mismatchedChainLinkText',
              },
            },
          },
        ],
      },
    },
  },
};

const MISMATCHED_NETWORK_NAME = {
  id: 'MISMATCHED_NETWORK_NAME',
  severity: SEVERITIES.WARNING,
  content: {
    element: 'span',
    children: {
      element: 'MetaMaskTranslation',
      props: {
        translationKey: 'mismatchedNetworkName',
      },
    },
  },
};

const MISMATCHED_NETWORK_SYMBOL = {
  id: 'MISMATCHED_NETWORK_SYMBOL',
  severity: SEVERITIES.DANGER,
  content: {
    element: 'span',
    children: {
      element: 'MetaMaskTranslation',
      props: {
        translationKey: 'mismatchedNetworkSymbol',
      },
    },
  },
};

const MISMATCHED_NETWORK_RPC = {
  id: 'MISMATCHED_NETWORK_RPC',
  severity: SEVERITIES.DANGER,
  content: {
    element: 'span',
    children: {
      element: 'MetaMaskTranslation',
      props: {
        translationKey: 'mismatchedRpcUrl',
      },
    },
  },
};

async function getAlerts(pendingApproval) {
  const alerts = [];
  const safeChainsList =
    (await fetchWithCache('https://chainid.network/chains.json')) || [];
  const matchedChain = safeChainsList.find(
    (chain) =>
      chain.chainId === parseInt(pendingApproval.requestData.chainId, 16),
  );

  const originIsMetaMask = pendingApproval.origin === 'metamask';
  if (originIsMetaMask && Boolean(matchedChain)) {
    return [];
  }

  if (matchedChain) {
    if (
      matchedChain.name.toLowerCase() !==
      pendingApproval.requestData.chainName.toLowerCase()
    ) {
      alerts.push(MISMATCHED_NETWORK_NAME);
    }
    if (
      matchedChain.nativeCurrency?.symbol !== pendingApproval.requestData.ticker
    ) {
      alerts.push(MISMATCHED_NETWORK_SYMBOL);
    }

    const { origin } = new URL(pendingApproval.requestData.rpcUrl);
    if (!matchedChain.rpc.map((rpc) => new URL(rpc).origin).includes(origin)) {
      alerts.push(MISMATCHED_NETWORK_RPC);
    }
  }

  if (!matchedChain) {
    alerts.push(UNRECOGNIZED_CHAIN);
  }

  if (alerts.length) {
    alerts.push(MISMATCHED_CHAIN_RECOMMENDATION);
  }

  return alerts;
}

function getValues(pendingApproval, t, actions, history) {
  const originIsMetaMask = pendingApproval.origin === 'metamask';

  return {
    content: [
      {
        hide: !originIsMetaMask,
        element: 'Box',
        key: 'network-box',
        props: {
          textAlign: TEXT_ALIGN.CENTER,
          display: DISPLAY.FLEX,
          justifyContent: JUSTIFY_CONTENT.CENTER,
          marginTop: 4,
          marginBottom: 2,
        },
        children: [
          {
            element: 'Chip',
            key: 'network-chip',
            props: {
              label: pendingApproval.requestData.chainName,
              backgroundColor: COLORS.BACKGROUND_ALTERNATIVE,
              leftIconUrl: pendingApproval.requestData.imageUrl,
            },
          },
        ],
      },
      {
        element: 'Typography',
        key: 'title',
        children: originIsMetaMask
          ? t('wantToAddThisNetwork')
          : t('addEthereumChainConfirmationTitle'),
        props: {
          variant: TYPOGRAPHY.H3,
          align: 'center',
          fontWeight: 'bold',
          boxProps: {
            margin: [0, 0, 4],
          },
        },
      },
      {
        element: 'Typography',
        key: 'description',
        children: t('addEthereumChainConfirmationDescription'),
        props: {
          variant: TYPOGRAPHY.H7,
          align: 'center',
          boxProps: {
            margin: originIsMetaMask ? [0, 8, 4] : [0, 0, 4],
          },
        },
      },
      {
        element: 'Typography',
        key: 'only-add-networks-you-trust',
        children: [
          {
            element: 'b',
            key: 'bolded-text',
            props: {
              style: { display: originIsMetaMask && '-webkit-box' },
            },
            children: [
              `${t('addEthereumChainConfirmationRisks')} `,
              {
                hide: !originIsMetaMask,
                element: 'Tooltip',
                key: 'tooltip-info',
                props: {
                  position: 'bottom',
                  interactive: true,
                  trigger: 'mouseenter',
                  html: (
                    <div
                      style={{
                        width: '180px',
                        margin: '16px',
                        textAlign: 'left',
                      }}
                    >
                      {t('someNetworksMayPoseSecurity')}{' '}
                      <a
                        key="zendesk_page_link"
                        href={ZENDESK_URLS.UNKNOWN_NETWORK}
                        rel="noreferrer"
                        target="_blank"
                        style={{ color: 'var(--color-primary-default)' }}
                      >
                        {t('learnMoreUpperCase')}
                      </a>
                    </div>
                  ),
                },
                children: [
                  {
                    element: 'i',
                    key: 'info-circle',
                    props: {
                      className: 'fas fa-info-circle',
                      style: {
                        marginLeft: '4px',
                        color: 'var(--color-icon-default)',
                      },
                    },
                  },
                ],
              },
            ],
          },
          {
            element: 'MetaMaskTranslation',
            key: 'learn-about-risks',
            props: {
              translationKey: 'addEthereumChainConfirmationRisksLearnMore',
              variables: [
                {
                  element: 'a',
                  children: t('addEthereumChainConfirmationRisksLearnMoreLink'),
                  key: 'addEthereumChainConfirmationRisksLearnMoreLink',
                  props: {
                    href: ZENDESK_URLS.USER_GUIDE_CUSTOM_NETWORKS,
                    target: '__blank',
                  },
                },
              ],
            },
          },
        ],
        props: {
          variant: TYPOGRAPHY.H7,
          boxProps: {
            margin: originIsMetaMask ? [0, 8] : 0,
            display: DISPLAY.FLEX,
            flexDirection: FLEX_DIRECTION.COLUMN,
            alignItems: ALIGN_ITEMS.CENTER,
          },
        },
      },
      {
        element: 'TruncatedDefinitionList',
        key: 'network-details',
        props: {
          title: t('networkDetails'),
          tooltips: {
            [t('networkName')]: t('networkNameDefinition'),
            [t('networkURL')]: t('networkURLDefinition'),
            [t('chainId')]: t('chainIdDefinition'),
            [t('currencySymbol')]: t('currencySymbolDefinition'),
            [t('blockExplorerUrl')]: t('blockExplorerUrlDefinition'),
          },
          dictionary: {
            [t('networkName')]: pendingApproval.requestData.chainName,
            [t('networkURL')]: pendingApproval.requestData.rpcUrl?.includes(
              `/v3/${infuraProjectId}`,
            )
              ? pendingApproval.requestData.rpcUrl.replace(
                  `/v3/${infuraProjectId}`,
                  '',
                )
              : pendingApproval.requestData.rpcUrl,
            [t('chainId')]: parseInt(pendingApproval.requestData.chainId, 16),
            [t('currencySymbol')]: pendingApproval.requestData.ticker,
            [t('blockExplorerUrl')]:
              pendingApproval.requestData.blockExplorerUrl,
          },
          prefaceKeys: [
            t('networkName'),
            t('networkURL'),
            t('chainId'),
            t('currencySymbol'),
          ],
        },
      },
    ],
    approvalText: t('approveButtonText'),
    cancelText: t('cancel'),
    onApprove: async () => {
      await actions.resolvePendingApproval(
        pendingApproval.id,
        pendingApproval.requestData,
      );
      if (originIsMetaMask) {
        actions.addCustomNetwork(pendingApproval.requestData);
        history.push(DEFAULT_ROUTE);
      }
    },
    onCancel: () =>
      actions.rejectPendingApproval(
        pendingApproval.id,
        ethErrors.provider.userRejectedRequest().serialize(),
      ),
    networkDisplay: !originIsMetaMask,
  };
}

const addEthereumChain = {
  getAlerts,
  getValues,
};

export default addEthereumChain;
