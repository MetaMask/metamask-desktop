const { merge } = require('lodash');

function defaultFixture() {
  return {
    data: {
      AlertController: {
        alertEnabledness: {
          unconnectedAccount: true,
          web3ShimUsage: true,
        },
        unconnectedAccountAlertShownOrigins: {},
        web3ShimUsageOrigins: {},
      },
      AnnouncementController: {
        announcements: {
          1: {
            date: '2021-03-17',
            id: 1,
            image: {
              height: '230px',
              placeImageBelowDescription: true,
              src: 'images/mobile-link-qr.svg',
              width: '230px',
            },
            isShown: false,
          },
          3: {
            date: '2021-03-08',
            id: 3,
            isShown: false,
          },
          4: {
            date: '2021-05-11',
            id: 4,
            image: {
              src: 'images/source-logos-bsc.svg',
              width: '100%',
            },
            isShown: false,
          },
          5: {
            date: '2021-06-09',
            id: 5,
            isShown: false,
          },
          6: {
            date: '2021-05-26',
            id: 6,
            isShown: false,
          },
          7: {
            date: '2021-09-17',
            id: 7,
            isShown: false,
          },
          8: {
            date: '2021-11-01',
            id: 8,
            isShown: false,
          },
          9: {
            date: '2021-12-07',
            id: 9,
            image: {
              src: 'images/txinsights.png',
              width: '80%',
            },
            isShown: false,
          },
          10: {
            date: '2022-09-15',
            id: 10,
            image: {
              src: 'images/token-detection.svg',
              width: '100%',
            },
            isShown: true,
          },
          11: {
            date: '2022-09-15',
            id: 11,
            isShown: true,
          },
          12: {
            date: '2022-05-18',
            id: 12,
            image: {
              src: 'images/darkmode-banner.png',
              width: '100%',
            },
            isShown: false,
          },
          13: {
            date: '2022-09-15',
            id: 13,
            isShown: false,
          },
          14: {
            date: '2022-09-15',
            id: 14,
            isShown: true,
          },
          15: {
            date: '2022-09-15',
            id: 15,
            isShown: true,
          },
        },
      },
      AppStateController: {
        browserEnvironment: {},
        collectiblesDetectionNoticeDismissed: false,
        collectiblesDropdownState: {},
        connectedStatusPopoverHasBeenShown: true,
        defaultHomeActiveTabName: null,
        enableEIP1559V2NoticeDismissed: false,
        fullScreenGasPollTokens: [],
        notificationGasPollTokens: [],
        popupGasPollTokens: [],
        qrHardware: {},
        recoveryPhraseReminderHasBeenShown: true,
        recoveryPhraseReminderLastShown:
          '__FIXTURE_SUBSTITUTION__currentDateInMilliseconds',
        showPortfolioTooltip: false,
        showTestnetMessageInDropdown: true,
        trezorModel: null,
        usedNetworks: {
          '0x1': true,
          '0x5': true,
          '0x539': true,
        },
      },
      CachedBalancesController: {
        cachedBalances: {
          '0x539': {},
        },
      },
      CurrencyController: {
        conversionDate: 1665507600.0,
        conversionRate: 1300.0,
        currentCurrency: 'usd',
        nativeCurrency: 'ETH',
        usdConversionRate: 1300.0,
      },
      GasFeeController: {
        estimatedGasFeeTimeBounds: {},
        gasEstimateType: 'none',
        gasFeeEstimates: {},
      },
      IncomingTransactionsController: {
        incomingTransactions: {},
        incomingTxLastFetchedBlockByChainId: {
          '0x1': null,
          '0x5': null,
          '0xaa36a7': null,
        },
      },
      KeyringController: {
        vault:
          '{"data":"s6TpYjlUNsn7ifhEFTkuDGBUM1GyOlPrim7JSjtfIxgTt8/6MiXgiR/CtFfR4dWW2xhq85/NGIBYEeWrZThGdKGarBzeIqBfLFhw9n509jprzJ0zc2Rf+9HVFGLw+xxC4xPxgCS0IIWeAJQ+XtGcHmn0UZXriXm8Ja4kdlow6SWinB7sr/WM3R0+frYs4WgllkwggDf2/Tv6VHygvLnhtzp6hIJFyTjh+l/KnyJTyZW1TkZhDaNDzX3SCOHT","iv":"FbeHDAW5afeWNORfNJBR0Q==","salt":"TxZ+WbCW6891C9LK/hbMAoUsSEW1E8pyGLVBU6x5KR8="}',
      },
      MetaMetricsController: {
        eventsBeforeMetricsOptIn: [],
        fragments: {},
        metaMetricsId: null,
        participateInMetaMetrics: false,
        traits: {},
      },
      NetworkController: {
        network: '1337',
        provider: {
          chainId: '0x539',
          nickname: 'Localhost 8545',
          rpcPrefs: {},
          rpcUrl: 'http://localhost:8545',
          ticker: 'ETH',
          type: 'rpc',
        },
      },
      OnboardingController: {
        completedOnboarding: true,
        firstTimeFlowType: 'import',
        onboardingTabs: {},
        seedPhraseBackedUp: true,
      },
      PermissionController: {
        subjects: {},
      },
      PreferencesController: {
        advancedGasFee: null,
        currentLocale: 'en',
        dismissSeedBackUpReminder: true,
        featureFlags: {
          showIncomingTransactions: true,
        },
        forgottenPassword: false,
        frequentRpcListDetail: [
          {
            chainId: '0x539',
            nickname: 'Localhost 8545',
            rpcPrefs: {},
            rpcUrl: 'http://localhost:8545',
            ticker: 'ETH',
          },
        ],
        identities: {
          '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': {
            address: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
            lastSelected: 1665507600000,
            name: 'Account 1',
          },
        },
        infuraBlocked: false,
        ipfsGateway: 'dweb.link',
        knownMethodData: {},
        ledgerTransportType: 'webhid',
        lostIdentities: {},
        openSeaEnabled: false,
        preferences: {
          hideZeroBalanceTokens: false,
          showFiatInTestnets: false,
          showTestNetworks: false,
          useNativeCurrencyAsPrimaryCurrency: true,
        },
        selectedAddress: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
        theme: 'light',
        useBlockie: false,
        useCollectibleDetection: false,
        useNonceField: false,
        usePhishDetect: true,
        useTokenDetection: false,
      },
      SmartTransactionsController: {
        smartTransactionsState: {
          fees: {},
          liveness: true,
          smartTransactions: {
            '0x1': [],
          },
        },
      },
      SubjectMetadataController: {
        subjectMetadata: {
          'https://metamask.github.io': {
            extensionId: null,
            iconUrl: null,
            name: 'MetaMask < = > Ledger Bridge',
            origin: 'https://metamask.github.io',
            subjectType: 'website',
          },
        },
      },
      TokensController: {
        allDetectedTokens: {},
        allIgnoredTokens: {},
        allTokens: {},
        detectedTokens: [],
        ignoredTokens: [],
        suggestedAssets: [],
        tokens: [],
      },
      TransactionController: {
        transactions: {},
      },
      config: {},
      firstTimeInfo: {
        date: 1665507600000,
        version: '10.21.0',
      },
    },
  };
}
function onboardingFixture() {
  return {
    data: {
      AppStateController: {
        browserEnvironment: {},
        collectiblesDetectionNoticeDismissed: false,
        collectiblesDropdownState: {},
        connectedStatusPopoverHasBeenShown: true,
        defaultHomeActiveTabName: null,
        enableEIP1559V2NoticeDismissed: false,
        fullScreenGasPollTokens: [],
        notificationGasPollTokens: [],
        popupGasPollTokens: [],
        qrHardware: {},
        recoveryPhraseReminderHasBeenShown: false,
        recoveryPhraseReminderLastShown:
          '__FIXTURE_SUBSTITUTION__currentDateInMilliseconds',
        showPortfolioTooltip: true,
        showTestnetMessageInDropdown: true,
        trezorModel: null,
        usedNetworks: {
          '0x1': true,
          '0x5': true,
          '0x539': true,
        },
      },
      NetworkController: {
        network: '1337',
        provider: {
          ticker: 'ETH',
          type: 'rpc',
          rpcUrl: 'http://localhost:8545',
          chainId: '0x539',
          nickname: 'Localhost 8545',
        },
      },
      PreferencesController: {
        advancedGasFee: null,
        currentLocale: 'en',
        dismissSeedBackUpReminder: false,
        featureFlags: {
          showIncomingTransactions: true,
        },
        forgottenPassword: false,
        frequentRpcListDetail: [
          {
            chainId: '0x539',
            nickname: 'Localhost 8545',
            rpcPrefs: {},
            rpcUrl: 'http://localhost:8545',
            ticker: 'ETH',
          },
        ],
        identities: {},
        infuraBlocked: false,
        ipfsGateway: 'dweb.link',
        knownMethodData: {},
        ledgerTransportType: 'webhid',
        lostIdentities: {},
        openSeaEnabled: false,
        preferences: {
          hideZeroBalanceTokens: false,
          showFiatInTestnets: false,
          showTestNetworks: false,
          useNativeCurrencyAsPrimaryCurrency: true,
        },
        theme: 'light',
        useBlockie: false,
        useCollectibleDetection: false,
        useNonceField: false,
        usePhishDetect: true,
        useTokenDetection: false,
      },
      SmartTransactionsController: {
        smartTransactionsState: {
          fees: {},
          liveness: true,
          smartTransactions: {
            '0x1': [],
          },
        },
      },
      TokensController: {
        allDetectedTokens: {},
        allIgnoredTokens: {},
        allTokens: {},
        detectedTokens: [],
        ignoredTokens: [],
        suggestedAssets: [],
        tokens: [],
      },
      config: {},
      firstTimeInfo: {
        date: 1665507600000,
        version: '10.21.0',
      },
    },
  };
}

class FixtureBuilder {
  constructor({ onboarding = false } = {}) {
    this.fixture = onboarding === true ? onboardingFixture() : defaultFixture();
  }

  withAddressBookController(data) {
    merge(
      this.fixture.data.AddressBookController
        ? this.fixture.data.AddressBookController
        : (this.fixture.data.AddressBookController = {}),
      data,
    );
    return this;
  }

  withAlertController(data) {
    merge(this.fixture.data.AlertController, data);
    return this;
  }

  withAnnouncementController(data) {
    merge(this.fixture.data.AnnouncementController, data);
    return this;
  }

  withAppStateController(data) {
    merge(this.fixture.data.AppStateController, data);
    return this;
  }

  withCachedBalancesController(data) {
    merge(this.fixture.data.CachedBalancesController, data);
    return this;
  }

  withCollectiblesController(data) {
    merge(
      this.fixture.data.CollectiblesController
        ? this.fixture.data.CollectiblesController
        : (this.fixture.data.CollectiblesController = {}),
      data,
    );
    return this;
  }

  withCurrencyController(data) {
    merge(this.fixture.data.CurrencyController, data);
    return this;
  }

  withGasFeeController(data) {
    merge(this.fixture.data.GasFeeController, data);
    return this;
  }

  withIncomingTransactionsController(data) {
    merge(
      this.fixture.data.IncomingTransactionsController
        ? this.fixture.data.IncomingTransactionsController
        : (this.fixture.data.IncomingTransactionsController = {}),
      data,
    );
    return this;
  }

  withKeyringController(data) {
    merge(this.fixture.data.KeyringController, data);
    return this;
  }

  withKeyringControllerImportedAccountVault() {
    return this.withKeyringController({
      vault:
        '{"data":"Ot+BTtJPag0xubdiv1nO9bsSvTHivHCd6CD7Lxgb1McYw3VqMjgp5rPMZmblJ1lscuMxyiqp99G52uXO9S0em6F9htpa+t/wn6qubRKTTNG9fxNzQrKXRDNhdgfYckVk5VAZ4fgl2iMZcRDvS8H/+gucVKJ33Sl6mXyPofdexXhWDCU6uR2YecnfaIum9cL2u/GqOMPE3jxzy0Wip0x2Jyp3QOKhvu8A3GIjzagLOaQ7a1APdl8=","iv":"lbsyPeGYWU6U1+jvmW9UHg==","salt":"Zmbhpskwxe4rYfXtELBvlcvW4HISPBATRmMqzsnZPMg="}',
    });
  }

  withMetaMetricsController(data) {
    merge(this.fixture.data.MetaMetricsController, data);
    return this;
  }

  withNetworkController(data) {
    merge(this.fixture.data.NetworkController, data);
    return this;
  }

  withOnboardingController(data) {
    merge(this.fixture.data.OnboardingController, data);
    return this;
  }

  withPermissionController(data) {
    merge(this.fixture.data.PermissionController, data);
    return this;
  }

  withPermissionControllerConnectedToTestDapp() {
    return this.withPermissionController({
      subjects: {
        'http://127.0.0.1:8080': {
          origin: 'http://127.0.0.1:8080',
          permissions: {
            eth_accounts: {
              id: 'ZaqPEWxyhNCJYACFw93jE',
              parentCapability: 'eth_accounts',
              invoker: 'http://127.0.0.1:8080',
              caveats: [
                {
                  type: 'restrictReturnedAccounts',
                  value: ['0x5cfe73b6021e818b776b421b1c4db2474086a7e1'],
                },
              ],
              date: 1664388714636,
            },
          },
        },
      },
    });
  }

  withPermissionControllerConnectedToSnapDapp() {
    return this.withPermissionController({
      subjects: {
        'https://metamask.github.io': {
          origin: 'https://metamask.github.io',
          permissions: {
            'wallet_snap_npm:@metamask/test-snap-bip32': {
              id: 'CwdJq0x8N_b9FNxn6dVuP',
              parentCapability: 'wallet_snap_npm:@metamask/test-snap-bip32',
              invoker: 'https://metamask.github.io',
              caveats: null,
              date: 1664388714636,
            },
            'wallet_snap_npm:@metamask/test-snap-bip44': {
              id: '8zH-0opWuZhvJew41FMVh',
              parentCapability: 'wallet_snap_npm:@metamask/test-snap-bip44',
              invoker: 'https://metamask.github.io',
              caveats: null,
              date: 1664388714636,
            },
            'wallet_snap_npm:@metamask/test-snap-confirm': {
              id: 'Wb_1c9toBggBQWfOJwjMg',
              parentCapability: 'wallet_snap_npm:@metamask/test-snap-confirm',
              invoker: 'https://metamask.github.io',
              caveats: null,
              date: 1664388714636,
            },
            'wallet_snap_npm:@metamask/test-snap-error': {
              id: '5FUZoCyimOWKTbuLCEOWa',
              parentCapability: 'wallet_snap_npm:@metamask/test-snap-error',
              invoker: 'https://metamask.github.io',
              caveats: null,
              date: 1664388714636,
            },
            'wallet_snap_npm:@metamask/test-snap-managestate': {
              id: 'Z6XPdyuCHCf1pyqSiU7nh',
              parentCapability:
                'wallet_snap_npm:@metamask/test-snap-managestate',
              invoker: 'https://metamask.github.io',
              caveats: null,
              date: 1664388714636,
            },
            'wallet_snap_npm:@metamask/test-snap-notification': {
              id: '_xfRMXzq0bs8QcXRcvjcP',
              parentCapability:
                'wallet_snap_npm:@metamask/test-snap-notification',
              invoker: 'https://metamask.github.io',
              caveats: null,
              date: 1664388714636,
            },
          },
        },
      },
    });
  }

  withPermissionLogController(data) {
    merge(
      this.fixture.data.PermissionLogController
        ? this.fixture.data.PermissionLogController
        : (this.fixture.data.PermissionLogController = {}),
      data,
    );
    return this;
  }

  withPreferencesController(data) {
    merge(this.fixture.data.PreferencesController, data);
    return this;
  }

  withPreferencesControllerImportedAccountIdentities() {
    return this.withPreferencesController({
      identities: {
        '0x0cc5261ab8ce458dc977078a3623e2badd27afd3': {
          name: 'Account 1',
          address: '0x0cc5261ab8ce458dc977078a3623e2badd27afd3',
          lastSelected: 1665507600000,
        },
        '0x3ed0ee22e0685ebbf07b2360a8331693c413cc59': {
          name: 'Account 2',
          address: '0x3ed0ee22e0685ebbf07b2360a8331693c413cc59',
        },
        '0xd38d853771fb546bd8b18b2f3638491bc0b0e906': {
          name: 'Account 3',
          address: '0xd38d853771fb546bd8b18b2f3638491bc0b0e906',
        },
      },
      selectedAddress: '0x0cc5261ab8ce458dc977078a3623e2badd27afd3',
    });
  }

  withSmartTransactionsController(data) {
    merge(this.fixture.data.SmartTransactionsController, data);
    return this;
  }

  withSubjectMetadataController(data) {
    merge(this.fixture.data.SubjectMetadataController, data);
    return this;
  }

  withTokenListController(data) {
    merge(
      this.fixture.data.TokenListController
        ? this.fixture.data.TokenListController
        : (this.fixture.data.TokenListController = {}),
      data,
    );
    return this;
  }

  withTokensController(data) {
    merge(this.fixture.data.TokensController, data);
    return this;
  }

  withTransactionController(data) {
    merge(
      this.fixture.data.TransactionController
        ? this.fixture.data.TransactionController
        : (this.fixture.data.TransactionController = {}),
      data,
    );
    return this;
  }

  withTransactionControllerMultipleTransactions() {
    return this.withTransactionController({
      transactions: {
        7911313280012623: {
          chainId: '0x539',
          dappSuggestedGasFees: {
            gas: '0x5208',
            gasPrice: '0x4a817c800',
          },
          history: [
            {
              chainId: '0x539',
              dappSuggestedGasFees: {
                gas: '0x5208',
                gasPrice: '0x4a817c800',
              },
              id: 7911313280012623,
              loadingDefaults: true,
              metamaskNetworkId: '1337',
              origin: 'https://metamask.github.io',
              status: 'unapproved',
              time: 1631545991949,
              txParams: {
                from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
                gas: '0x5208',
                gasPrice: '0x4a817c800',
                to: '0x2f318c334780961fb129d2a6c30d0763d9a5c970',
                value: '0x29a2241af62c0000',
              },
              type: 'simpleSend',
            },
            [
              {
                note: 'Added new unapproved transaction.',
                op: 'replace',
                path: '/loadingDefaults',
                timestamp: 1631545992244,
                value: false,
              },
            ],
          ],
          id: 7911313280012623,
          loadingDefaults: false,
          metamaskNetworkId: '1337',
          origin: 'https://metamask.github.io',
          status: 'unapproved',
          time: 1631545991949,
          txParams: {
            from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
            gas: '0x5208',
            gasPrice: '0x4a817c800',
            to: '0x2f318c334780961fb129d2a6c30d0763d9a5c970',
            value: '0x29a2241af62c0000',
          },
          type: 'simpleSend',
        },
        7911313280012624: {
          chainId: '0x539',
          dappSuggestedGasFees: {
            gas: '0x5208',
            gasPrice: '0x4a817c800',
          },
          history: [
            {
              chainId: '0x539',
              dappSuggestedGasFees: {
                gas: '0x5208',
                gasPrice: '0x4a817c800',
              },
              id: 7911313280012624,
              loadingDefaults: true,
              metamaskNetworkId: '1337',
              origin: 'https://metamask.github.io',
              status: 'unapproved',
              time: 1631545994578,
              txParams: {
                from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
                gas: '0x5208',
                gasPrice: '0x4a817c800',
                to: '0x2f318c334780961fb129d2a6c30d0763d9a5c970',
                value: '0x29a2241af62c0000',
              },
              type: 'simpleSend',
            },
            [
              {
                note: 'Added new unapproved transaction.',
                op: 'replace',
                path: '/loadingDefaults',
                timestamp: 1631545994695,
                value: false,
              },
            ],
          ],
          id: 7911313280012624,
          loadingDefaults: false,
          metamaskNetworkId: '1337',
          origin: 'https://metamask.github.io',
          status: 'unapproved',
          time: 1631545994578,
          txParams: {
            from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
            gas: '0x5208',
            gasPrice: '0x4a817c800',
            to: '0x2f318c334780961fb129d2a6c30d0763d9a5c970',
            value: '0x29a2241af62c0000',
          },
          type: 'simpleSend',
        },
        7911313280012625: {
          chainId: '0x539',
          dappSuggestedGasFees: {
            gas: '0x5208',
            gasPrice: '0x4a817c800',
          },
          history: [
            {
              chainId: '0x539',
              dappSuggestedGasFees: {
                gas: '0x5208',
                gasPrice: '0x4a817c800',
              },
              id: 7911313280012625,
              loadingDefaults: true,
              metamaskNetworkId: '1337',
              origin: 'https://metamask.github.io',
              status: 'unapproved',
              time: 1631545996673,
              txParams: {
                from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
                gas: '0x5208',
                gasPrice: '0x4a817c800',
                to: '0x2f318c334780961fb129d2a6c30d0763d9a5c970',
                value: '0x29a2241af62c0000',
              },
              type: 'simpleSend',
            },
            [
              {
                note: 'Added new unapproved transaction.',
                op: 'replace',
                path: '/loadingDefaults',
                timestamp: 1631545996678,
                value: false,
              },
            ],
          ],
          id: 7911313280012625,
          loadingDefaults: false,
          metamaskNetworkId: '1337',
          origin: 'https://metamask.github.io',
          status: 'unapproved',
          time: 1631545996673,
          txParams: {
            from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
            gas: '0x5208',
            gasPrice: '0x4a817c800',
            to: '0x2f318c334780961fb129d2a6c30d0763d9a5c970',
            value: '0x29a2241af62c0000',
          },
          type: 'simpleSend',
        },
        7911313280012626: {
          chainId: '0x539',
          dappSuggestedGasFees: {
            gas: '0x5208',
            gasPrice: '0x4a817c800',
          },
          history: [
            {
              chainId: '0x539',
              dappSuggestedGasFees: {
                gas: '0x5208',
                gasPrice: '0x4a817c800',
              },
              id: 7911313280012626,
              loadingDefaults: true,
              metamaskNetworkId: '1337',
              origin: 'https://metamask.github.io',
              status: 'unapproved',
              time: 1631545998675,
              txParams: {
                from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
                gas: '0x5208',
                gasPrice: '0x4a817c800',
                to: '0x2f318c334780961fb129d2a6c30d0763d9a5c970',
                value: '0x29a2241af62c0000',
              },
              type: 'simpleSend',
            },
            [
              {
                note: 'Added new unapproved transaction.',
                op: 'replace',
                path: '/loadingDefaults',
                timestamp: 1631545998677,
                value: false,
              },
            ],
          ],
          id: 7911313280012626,
          loadingDefaults: false,
          metamaskNetworkId: '1337',
          origin: 'https://metamask.github.io',
          status: 'unapproved',
          time: 1631545998675,
          txParams: {
            from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
            gas: '0x5208',
            gasPrice: '0x4a817c800',
            to: '0x2f318c334780961fb129d2a6c30d0763d9a5c970',
            value: '0x29a2241af62c0000',
          },
          type: 'simpleSend',
        },
      },
    });
  }

  withTransactionControllerTypeOneTransaction() {
    return this.withTransactionController({
      transactions: {
        4046084157914634: {
          chainId: '0x539',
          history: [
            {
              chainId: '0x539',
              id: 4046084157914634,
              loadingDefaults: true,
              metamaskNetworkId: '1337',
              origin: 'metamask',
              status: 'unapproved',
              time: 1617228030067,
              txParams: {
                from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
                gas: '0x61a8',
                gasPrice: '0x2540be400',
                to: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
                value: '0xde0b6b3a7640000',
              },
              type: 'simpleSend',
            },
            [
              {
                note: 'Added new unapproved transaction.',
                op: 'replace',
                path: '/loadingDefaults',
                timestamp: 1617228030069,
                value: false,
              },
            ],
          ],
          id: 4046084157914634,
          loadingDefaults: false,
          metamaskNetworkId: '1337',
          origin: 'metamask',
          primaryTransaction: {
            chainId: '0x539',
            id: 4046084157914634,
            loadingDefaults: true,
            metamaskNetworkId: '1337',
            origin: 'metamask',
            status: 'unapproved',
            time: 1617228030067,
            txParams: {
              from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
              gas: '0x61a8',
              gasPrice: '0x2540be400',
              to: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
              value: '0xde0b6b3a7640000',
            },
            type: 'sentEther',
          },
          status: 'unapproved',
          time: 1617228030067,
          txParams: {
            from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
            gas: '0x61a8',
            gasPrice: '0x2540be400',
            to: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
            value: '0xde0b6b3a7640000',
          },
          type: 'simpleSend',
        },
      },
    });
  }

  withTransactionControllerTypeTwoTransaction() {
    return this.withTransactionController({
      transactions: {
        4046084157914634: {
          chainId: '0x539',
          history: [
            {
              chainId: '0x539',
              id: 4046084157914634,
              loadingDefaults: true,
              metamaskNetworkId: '1337',
              origin: 'metamask',
              status: 'unapproved',
              time: 1617228030067,
              txParams: {
                from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
                gas: '0x61a8',
                maxFeePerGas: '0x59682f0c',
                maxPriorityFeePerGas: '0x59682f00',
                to: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
                type: '0x2',
                value: '0xde0b6b3a7640000',
              },
              type: 'simpleSend',
            },
            [
              {
                note: 'Added new unapproved transaction.',
                op: 'replace',
                path: '/loadingDefaults',
                timestamp: 1617228030069,
                value: false,
              },
            ],
          ],
          id: 4046084157914634,
          loadingDefaults: false,
          metamaskNetworkId: '1337',
          origin: 'metamask',
          primaryTransaction: {
            chainId: '0x539',
            id: 4046084157914634,
            loadingDefaults: true,
            metamaskNetworkId: '1337',
            origin: 'metamask',
            status: 'unapproved',
            time: 1617228030067,
            txParams: {
              from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
              gas: '0x61a8',
              maxFeePerGas: '0x59682f0c',
              maxPriorityFeePerGas: '0x59682f00',
              to: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
              type: '0x2',
              value: '0xde0b6b3a7640000',
            },
            type: 'sentEther',
          },
          status: 'unapproved',
          time: 1617228030067,
          txParams: {
            from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
            gas: '0x61a8',
            maxFeePerGas: '0x59682f0c',
            maxPriorityFeePerGas: '0x59682f00',
            to: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
            type: '0x2',
            value: '0xde0b6b3a7640000',
          },
          type: 'simpleSend',
        },
      },
    });
  }

  withTransactionControllerApprovedTransaction() {
    return this.withTransactionController({
      transactions: {
        4046084157914634: {
          chainId: '0x539',
          history: [
            {
              chainId: '0x539',
              id: 4046084157914634,
              loadingDefaults: true,
              metamaskNetworkId: '1337',
              origin: 'metamask',
              status: 'unapproved',
              time: 1617228030067,
              txParams: {
                from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
                gas: '0x61a8',
                maxFeePerGas: '0x59682f0c',
                maxPriorityFeePerGas: '0x59682f00',
                to: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
                type: '0x2',
                value: '0xde0b6b3a7640000',
              },
              type: 'simpleSend',
            },
            [
              {
                note: 'Added new unapproved transaction.',
                op: 'replace',
                path: '/loadingDefaults',
                timestamp: 1617228030069,
                value: false,
              },
            ],
            [
              {
                op: 'add',
                path: '/txParams/nonce',
                value: '0x0',
                note: 'transactions#approveTransaction',
                timestamp: 1617228031069,
              },
              {
                op: 'add',
                path: '/nonceDetails',
                value: {
                  params: {
                    highestLocallyConfirmed: 0,
                    highestSuggested: 0,
                    nextNetworkNonce: 0,
                  },
                  local: {
                    name: 'local',
                    nonce: 0,
                    details: {
                      startPoint: 0,
                      highest: 0,
                    },
                  },
                  network: {
                    name: 'network',
                    nonce: 0,
                    details: {
                      blockNumber: '0x0',
                      baseCount: 0,
                    },
                  },
                },
              },
            ],
          ],
          id: 4046084157914634,
          loadingDefaults: false,
          metamaskNetworkId: '1337',
          origin: 'metamask',
          primaryTransaction: {
            chainId: '0x539',
            id: 4046084157914634,
            loadingDefaults: true,
            metamaskNetworkId: '1337',
            origin: 'metamask',
            status: 'approved',
            time: 1617228030067,
            txParams: {
              from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
              gas: '0x61a8',
              maxFeePerGas: '0x59682f0c',
              maxPriorityFeePerGas: '0x59682f00',
              to: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
              type: '0x2',
              value: '0xde0b6b3a7640000',
            },
            type: 'sentEther',
          },
          status: 'approved',
          time: 1617228030067,
          txParams: {
            from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
            gas: '0x61a8',
            maxFeePerGas: '0x59682f0c',
            maxPriorityFeePerGas: '0x59682f00',
            to: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
            type: '0x2',
            value: '0xde0b6b3a7640000',
          },
          type: 'simpleSend',
        },
      },
    });
  }

  build() {
    this.fixture.meta = {
      version: 74,
    };
    return this.fixture;
  }
}

module.exports = FixtureBuilder;
