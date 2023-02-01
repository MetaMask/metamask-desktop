/* eslint-disable jest/no-focused-tests */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import Eth from '@ledgerhq/hw-app-eth';
import HDKey from 'hdkey';
import { LedgerBridgeKeyring, LedgerKeyringProperties } from './ledger-keyring';

// Two different addresses to simulate first and second page
const mockAddresses = [
  ...[...Array(5).keys()].map((i) => ({
    publicKey:
      '045fe42287aa8340a7d0b7f3e941f6419bedc12116cd9fa2be1030751f4763e7e90de4f470b7913471d202a6fd6c96539ae816dd9135175a4b88f99d7e62c53154',
    privateKey:
      'd20cb9c136e87060a1e64dbd1231d5af4c4bd8313b6a1241f695ffcb08c89220',
    address: '0xc759036ABD768e608ceCcCA941c5617CA840a4D1',
    chainCode: '12345',
    legacyPath: `m/${i}`,
  })),
  ...[...Array(5).keys()].map((i) => ({
    publicKey:
      '04ff17fb2de4f3170d36dca1e1af875db395492acfb23ea6a22afdaf241616f992d65b5785f3d58ae162919ffaf7583b909aace92b1f880cea3816daa345394e1f',
    privateKey:
      '1ec803fa4209ef8bcb55435f75f61636dac9890e2b987f36b754ef9b87d74f6f',
    address: '0xBE64aD34AefD5Ff15071a8C4904116CbfA5bB16c',
    chainCode: '54321',
    legacyPath: `m/${i + 5}`,
  })),
];

jest.mock(
  '@ledgerhq/hw-transport-node-hid-noevents',
  () => ({
    open: jest.fn(() => {
      Promise.resolve({
        close: jest.fn(() => Promise.resolve()),
      });
    }),
  }),
  {
    virtual: true,
  },
);

jest.mock('@ledgerhq/hw-app-eth', () => jest.fn(), { virtual: true });

jest.mock(
  'hdkey',
  () => {
    return jest.fn(() => {
      return {
        derive: jest.fn((path: string) => {
          return {
            publicKey: Buffer.from(
              mockAddresses.filter((a) => a.legacyPath === path)[0].publicKey,
            ),
          };
        }),
      };
    });
  },
  {
    virtual: true,
  },
);

jest.mock(
  'ethereumjs-util',
  () => {
    const originalModule = jest.requireActual('ethereumjs-util');

    return {
      ...originalModule,
      publicToAddress: jest.fn((publicKey: Buffer) => {
        return Buffer.from(
          mockAddresses
            .filter((a) => a.publicKey === publicKey.toString())[0]
            .address.replace('0x', '')
            .toUpperCase(),
          'hex',
        );
      }),
    };
  },
  {
    virtual: true,
  },
);

jest.mock(
  'eth-sig-util',
  () => {
    const originalModule = jest.requireActual('eth-sig-util');

    return {
      ...originalModule,
      recoverPersonalSignature: jest.fn((params: any) => {
        return params.data === 'Invalid Test'
          ? '0x0000000000000000000000000000000000000000'
          : mockAddresses[0].address;
      }),
      recoverTypedSignature_v4: jest.fn((params: any) => {
        return params.data === 'Invalid Test'
          ? '0x0000000000000000000000000000000000000000'
          : mockAddresses[0].address;
      }),
      TypedDataUtils: {
        ...originalModule.TypedDataUtils,
        sanitizeData: jest.fn(() => ({
          primaryType: 'primaryType',
        })),
        hashStruct: jest.fn(() => {
          return Buffer.from('test');
        }),
      },
    };
  },
  {
    virtual: true,
  },
);

jest.mock(
  '@ethereumjs/tx',
  () => {
    const originalModule = jest.requireActual('@ethereumjs/tx');

    return {
      ...originalModule,
      TransactionFactory: {
        fromTxData: jest.fn((txData: any) => {
          return {
            verifySignature: () => txData.valid,
            test: 'test',
          };
        }),
      },
    };
  },
  {
    virtual: true,
  },
);

describe('Ledger Keyring', () => {
  let ledgerKeyring: LedgerBridgeKeyring;

  let ledgerAppConstructorMock: any;
  let ledgerAppMock: jest.Mocked<Partial<Eth>>;

  beforeEach(() => {
    ledgerKeyring = new LedgerBridgeKeyring();
    ledgerAppConstructorMock = Eth;

    ledgerAppMock = {
      getAddress: jest
        .fn()
        .mockImplementation(() => Promise.resolve(mockAddresses[0])),
      signPersonalMessage: jest.fn().mockImplementation(() =>
        Promise.resolve({
          r: '1234',
          s: '5678',
          v: 28,
        }),
      ),
      signEIP712HashedMessage: jest.fn().mockImplementation(() =>
        Promise.resolve({
          r: '4321',
          s: '8765',
          v: 28,
        }),
      ),
      signTransaction: jest.fn().mockImplementation(() =>
        Promise.resolve({
          r: '11111111111',
          s: '00000000000',
          v: '28',
        }),
      ),
    };
    ledgerAppConstructorMock.mockReturnValue(ledgerAppMock);
  });

  describe('serialization', () => {
    it('no arguments', async () => {
      await ledgerKeyring.deserialize();

      const result = await ledgerKeyring.serialize();

      expect(result.hdPath).toStrictEqual(`m/44'/60'/0'`);
      expect(result.accounts).toStrictEqual([]);
      expect(result.accountDetails).toStrictEqual({});
      expect(result.implementFullBIP44).toStrictEqual(false);
    });

    it('arguments', async () => {
      const opts: Partial<LedgerKeyringProperties> = {
        hdPath: `m/44'/60'/0'/0/0`,
        accounts: [
          '0xB6cA462a2b5c7654267cff94C7e02fcB5fdDDf39',
          '0x22de46fd84cECE4407d655E8fBC4aBDda0f0f523',
        ],
        accountDetails: {
          '0xB6cA462a2b5c7654267cff94C7e02fcB5fdDDf39': {
            bip44: true,
            hdPath: `m/44'/60'/1'/0/0`,
          },
          '0x22de46fd84cECE4407d655E8fBC4aBDda0f0f523': {
            bip44: false,
            hdPath: `m/44'/60'/0'/1`,
          },
        },
        implementFullBIP44: true,
      };

      await ledgerKeyring.deserialize(opts);

      const result = await ledgerKeyring.serialize();

      expect(result.hdPath).toStrictEqual(opts.hdPath);
      expect(result.accounts).toStrictEqual(opts.accounts);
      expect(result.accountDetails).toStrictEqual(opts.accountDetails);
      expect(result.implementFullBIP44).toStrictEqual(false);
    });

    it('remove accounts without details', async () => {
      const opts: Partial<LedgerKeyringProperties> = {
        accounts: [
          '0xB6cA462a2b5c7654267cff94C7e02fcB5fdDDf39',
          '0x22de46fd84cECE4407d655E8fBC4aBDda0f0f523',
        ],
        accountDetails: {
          '0x22de46fd84cECE4407d655E8fBC4aBDda0f0f523': {
            bip44: false,
            hdPath: `m/44'/60'/0'/1`,
          },
        },
      };

      await ledgerKeyring.deserialize(opts);

      const result = await ledgerKeyring.serialize();

      expect(result.accounts).toStrictEqual([opts.accounts![1]]);
      expect(result.accountDetails).toStrictEqual(opts.accountDetails);
    });
  });

  describe('paging', () => {
    it('getFirstPage', async () => {
      const page = await ledgerKeyring.getFirstPage();

      expect(page).toStrictEqual(
        [...Array(5).keys()].map((i) => ({
          address: mockAddresses[0].address,
          balance: null,
          index: i,
        })),
      );

      expect(ledgerAppMock.getAddress).toHaveBeenCalledTimes(1);
      expect(ledgerAppMock.getAddress).toHaveBeenLastCalledWith(
        "m/44'/60'/0'",
        false,
        true,
      );
    });

    it('getNextPage', async () => {
      await ledgerKeyring.getFirstPage();
      const page = await ledgerKeyring.getNextPage();

      expect(page).toStrictEqual(
        [...Array(5).keys()].map((i) => ({
          address: mockAddresses[5].address,
          balance: null,
          index: i + 5,
        })),
      );
    });

    it('getPreviousPage', async () => {
      await ledgerKeyring.getFirstPage();
      await ledgerKeyring.getNextPage();
      const page = await ledgerKeyring.getPreviousPage();

      expect(page).toStrictEqual(
        [...Array(5).keys()].map((i) => ({
          address: mockAddresses[0].address,
          balance: null,
          index: i,
        })),
      );
    });
  });

  describe('getAccounts', () => {
    it('getAccounts', async () => {
      const accounts = await ledgerKeyring.getAccounts();

      expect(accounts).toStrictEqual([]);
    });
  });

  describe('isUnlocked', () => {
    it('locked', async () => {
      const isUnlocked = ledgerKeyring.isUnlocked();

      expect(isUnlocked).toStrictEqual(false);
    });

    it('locked missing public key', async () => {
      ledgerKeyring.hdk = new HDKey();
      const isUnlocked = ledgerKeyring.isUnlocked();

      expect(isUnlocked).toStrictEqual(false);
    });

    it('unlocked', async () => {
      ledgerKeyring.hdk = new HDKey();
      ledgerKeyring.hdk.publicKey = Buffer.from('12345');
      const isUnlocked = ledgerKeyring.isUnlocked();

      expect(isUnlocked).toStrictEqual(true);
    });
  });

  describe('setAccountToUnlock', () => {
    it('setAccountToUnlock', async () => {
      ledgerKeyring.setAccountToUnlock('1');
      const unlockedAccount1 = ledgerKeyring.unlockedAccount;

      ledgerKeyring.setAccountToUnlock('2');
      const unlockedAccount2 = ledgerKeyring.unlockedAccount;

      expect(unlockedAccount1).toStrictEqual(1);
      expect(unlockedAccount2).toStrictEqual(2);
    });
  });

  describe('addAccounts', () => {
    it('addAccounts', async () => {
      const accounts = await ledgerKeyring.addAccounts();

      expect(accounts).toStrictEqual([mockAddresses[0].address]);
    });
  });

  describe('removeAccount', () => {
    it('account exists', async () => {
      await ledgerKeyring.addAccounts();
      ledgerKeyring.removeAccount(mockAddresses[0].address);
      const accounts = await ledgerKeyring.getAccounts();

      expect(accounts).toStrictEqual([]);
    });

    it('account does not exist', async () => {
      expect(() =>
        ledgerKeyring.removeAccount(mockAddresses[0].address),
      ).toThrow(
        `Address ${mockAddresses[0].address} not found in this keyring`,
      );
    });
  });

  describe('exportAccount', () => {
    it('exportAccount', async () => {
      await expect(() => ledgerKeyring.exportAccount()).rejects.toThrow(
        'Not supported on this device',
      );
    });
  });

  describe('forgetDevice', () => {
    it('forgetDevice', async () => {
      await ledgerKeyring.getFirstPage();
      await ledgerKeyring.getNextPage();
      await ledgerKeyring.addAccounts();
      ledgerKeyring.forgetDevice();

      expect(ledgerKeyring.accounts).toStrictEqual([]);
      expect(ledgerKeyring.page).toStrictEqual(0);
      expect(ledgerKeyring.unlockedAccount).toStrictEqual(0);
      expect(ledgerKeyring.paths).toStrictEqual({});
      expect(ledgerKeyring.accountDetails).toStrictEqual({});
      expect(ledgerKeyring.hdk).toBeDefined();
    });
  });

  describe('signMessage', () => {
    it('signMessage', async () => {
      await ledgerKeyring.addAccounts();

      const signature = await ledgerKeyring.signMessage(
        mockAddresses[0].address,
        'Test',
      );

      expect(signature).toStrictEqual('0x1234567801');
    });
  });

  describe('signPersonalMessage', () => {
    it('signPersonalMessage', async () => {
      await ledgerKeyring.addAccounts();

      const signature = await ledgerKeyring.signPersonalMessage(
        mockAddresses[0].address,
        'Test',
      );

      expect(signature).toStrictEqual('0x1234567801');
    });

    it('signPersonalMessage - error validating', async () => {
      await ledgerKeyring.addAccounts();

      await expect(
        ledgerKeyring.signPersonalMessage(
          mockAddresses[0].address,
          'Invalid Test',
        ),
      ).rejects.toThrow('Ledger: The signature doesnt match the right address');
    });
  });

  describe('signTypedData', () => {
    it('signTypedData', async () => {
      await ledgerKeyring.addAccounts();

      const signature = await ledgerKeyring.signTypedData(
        mockAddresses[0].address,
        'Test',
        {
          version: 'V4',
        },
      );

      expect(signature).toStrictEqual('0x4321876501');
    });

    it('signTypedData - no V4', async () => {
      await ledgerKeyring.addAccounts();

      await expect(
        ledgerKeyring.signTypedData(mockAddresses[0].address, 'Test', {
          version: 'V1',
        }),
      ).rejects.toThrow(
        'Ledger: Only version 4 of typed data signing is supported',
      );
    });

    it('signTypedData - error validating', async () => {
      await ledgerKeyring.addAccounts();

      await expect(
        ledgerKeyring.signTypedData(mockAddresses[0].address, 'Invalid Test', {
          version: 'V4',
        }),
      ).rejects.toThrow('Ledger: The signature doesnt match the right address');
    });
  });

  describe('signTransaction', () => {
    it('old tx type', async () => {
      await ledgerKeyring.addAccounts();

      const tx = {
        getChainId: () => Buffer.from('TestChainId'),
        serialize: () => Buffer.from('RawTx'),
        verifySignature: () => true,
      };

      const modifiedTx = await ledgerKeyring.signTransaction(
        mockAddresses[0].address,
        tx,
      );

      expect(modifiedTx).toStrictEqual({
        ...tx,
        r: Buffer.from('11111111111', 'hex'),
        s: Buffer.from('00000000000', 'hex'),
        v: Buffer.from('28', 'hex'),
      });
    });

    it('old tx type - error validating', async () => {
      await ledgerKeyring.addAccounts();

      const tx = {
        getChainId: () => Buffer.from('TestChainId'),
        serialize: () => Buffer.from('RawTx'),
        verifySignature: () => false,
      };

      await expect(
        ledgerKeyring.signTransaction(mockAddresses[0].address, tx),
      ).rejects.toThrow('Ledger: The transaction signature is not valid');
    });

    it('new tx type', async () => {
      await ledgerKeyring.addAccounts();

      const tx = {
        getMessageToSign: () => Buffer.from('MessageToSign'),
        type: 'txType',
        toJSON: () => ({ valid: true }),
      };

      const modifiedTx = await ledgerKeyring.signTransaction(
        mockAddresses[0].address,
        tx,
      );

      expect(modifiedTx).toStrictEqual(
        expect.objectContaining({
          test: 'test',
          verifySignature: expect.anything(),
        }),
      );
    });

    it('new tx type - error validating', async () => {
      await ledgerKeyring.addAccounts();

      const tx = {
        getMessageToSign: () => Buffer.from('MessageToSign'),
        type: 'txType',
        toJSON: () => ({ valid: false }),
      };

      await expect(
        ledgerKeyring.signTransaction(mockAddresses[0].address, tx),
      ).rejects.toThrow('Ledger: The transaction signature is not valid');
    });
  });
});
