import { EventEmitter } from 'events';
import * as ethUtil from 'ethereumjs-util';
import * as sigUtil from 'eth-sig-util';
import HDKey from 'hdkey';
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid-noevents';
import Eth from '@ledgerhq/hw-app-eth';
import { TransactionFactory } from '@ethereumjs/tx';

const pathBase = 'm';
const hdPathString = `${pathBase}/44'/60'/0'`;

const MAX_INDEX = 1000;
const NETWORK_API_URLS = {
  ropsten: 'http://api-ropsten.etherscan.io',
  kovan: 'http://api-kovan.etherscan.io',
  rinkeby: 'https://api-rinkeby.etherscan.io',
  mainnet: 'https://api.etherscan.io',
};

export type LedgerKeyringProperties = {
  hdPath: string;
  accounts: string[];
  accountDetails: LedgerKeyringAccountDetails;
  implementFullBIP44: boolean;
  accountIndexes: { [key: string]: number };
};

export type LedgerKeyringAccountDetails = {
  [key: string]: { bip44: boolean; hdPath: string };
};

export class LedgerBridgeKeyring extends EventEmitter {
  // Keyring type is accessed both at class level and instance level by KeyringController
  public static type = 'Ledger Hardware';

  public type = LedgerBridgeKeyring.type;

  public hdPath!: string; // Assigned in deserialize

  public accounts!: string[]; // Assigned in deserialize

  public accountDetails!: LedgerKeyringAccountDetails; // Assigned in deserialize

  public implementFullBIP44!: boolean; // Assigned in deserialize

  public page = 0;

  public perPage = 5;

  public unlockedAccount = 0;

  public hdk: HDKey;

  public eth: Eth | undefined;

  public transport: TransportNodeHid | undefined;

  // This only seems to be used for _migrateAccountDetails
  public paths: { [key: string]: number } = {};

  public constructor(opts: Partial<LedgerKeyringProperties> = {}) {
    super();
    this.deserialize(opts);
    this.hdk = new HDKey();
  }

  public serialize(): Promise<Partial<LedgerKeyringProperties>> {
    return Promise.resolve({
      hdPath: this.hdPath,
      accounts: this.accounts,
      accountDetails: this.accountDetails,
      implementFullBIP44: false,
    });
  }

  public deserialize(opts: Partial<LedgerKeyringProperties> = {}) {
    this.hdPath = opts.hdPath || hdPathString;
    this.accounts = opts.accounts || [];
    this.accountDetails = opts.accountDetails || {};
    if (!opts.accountDetails) {
      this._migrateAccountDetails(opts);
    }

    this.implementFullBIP44 = opts.implementFullBIP44 || false;

    // Remove accounts that don't have corresponding account details
    this.accounts = this.accounts.filter((account) =>
      Object.keys(this.accountDetails).includes(
        ethUtil.toChecksumAddress(account),
      ),
    );

    return Promise.resolve();
  }

  public getFirstPage() {
    this.page = 0;
    return this.__getPage(1);
  }

  public getNextPage() {
    return this.__getPage(1);
  }

  public getPreviousPage() {
    return this.__getPage(-1);
  }

  public getAccounts() {
    return Promise.resolve(this.accounts.slice());
  }

  public isUnlocked() {
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    return Boolean(this.hdk && this.hdk.publicKey);
  }

  public setHdPath(hdPath: string) {
    // Reset HDKey if the path changes
    if (this.hdPath !== hdPath) {
      this.hdk = new HDKey();
    }
    this.hdPath = hdPath;
  }

  public setAccountToUnlock(index: string) {
    this.unlockedAccount = parseInt(index, 10);
  }

  public async addAccounts(n = 1) {
    await this.unlock();

    const from = this.unlockedAccount;
    const to = from + n;
    for (let i = from; i < to; i++) {
      const path = this._getPathForIndex(i);
      let address;
      if (this._isLedgerLiveHdPath()) {
        address = await this.unlock(path);
      } else {
        address = this._addressFromIndex(i);
      }
      this.accountDetails[ethUtil.toChecksumAddress(address)] = {
        // TODO: consider renaming this property, as the current name is misleading
        // It's currently used to represent whether an account uses the Ledger Live path.
        bip44: this._isLedgerLiveHdPath(),
        hdPath: path,
      };

      if (!this.accounts.includes(address)) {
        this.accounts.push(address);
      }
      this.page = 0;
    }

    return this.accounts;
  }

  public removeAccount(address: string) {
    if (
      !this.accounts.map((a) => a.toLowerCase()).includes(address.toLowerCase())
    ) {
      throw new Error(`Address ${address} not found in this keyring`);
    }
    this.accounts = this.accounts.filter(
      (a) => a.toLowerCase() !== address.toLowerCase(),
    );
    delete this.accountDetails[ethUtil.toChecksumAddress(address)];
  }

  public exportAccount() {
    return Promise.reject(new Error('Not supported on this device'));
  }

  public forgetDevice() {
    this.accounts = [];
    this.page = 0;
    this.unlockedAccount = 0;
    this.paths = {};
    this.accountDetails = {};
    this.hdk = new HDKey();
  }

  // TODO Still not implemented
  // public updateTransportMethod() {
  //   throw new Error('TO BE IMPLEMENTED WITH LEDGER LIVE SUPPORT');
  // }

  public signMessage(withAccount: string, data: string) {
    return this.signPersonalMessage(withAccount, data);
  }

  // For personal_sign, we need to prefix the message:
  public async signPersonalMessage(withAccount: string, message: string) {
    const hdPath = await this.unlockAccountByAddress(withAccount);

    let payload: {
      v: number;
      s: string;
      r: string;
    };
    try {
      await this.makeApp();

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      payload = await this.eth!.signPersonalMessage(
        hdPath,
        ethUtil.stripHexPrefix(message),
      );
    } catch (error) {
      throw this.ledgerErrToMessage(error);
    } finally {
      await this.cleanUp();
    }

    const v1 = payload.v - 27;
    const v2 = v1.toString(16);
    const v = v2.length < 2 ? `0${v2}` : v2;

    const signature = `0x${payload.r}${payload.s}${v}`;
    const addressSignedWith = sigUtil.recoverPersonalSignature({
      data: message,
      sig: signature,
    });

    if (
      ethUtil.toChecksumAddress(addressSignedWith) !==
      ethUtil.toChecksumAddress(withAccount)
    ) {
      throw new Error('Ledger: The signature doesnt match the right address');
    }

    return signature;
  }

  public async signTypedData(
    withAccount: string,
    data: string,
    options: { version?: string } = {},
  ) {
    const isV4 = options.version === 'V4';
    if (!isV4) {
      throw new Error(
        'Ledger: Only version 4 of typed data signing is supported',
      );
    }

    const { domain, types, primaryType, message } =
      sigUtil.TypedDataUtils.sanitizeData(data);
    const domainSeparatorHex = sigUtil.TypedDataUtils.hashStruct(
      'EIP712Domain',
      domain,
      types,
      isV4,
    ).toString('hex');
    const hashStructMessageHex = sigUtil.TypedDataUtils.hashStruct(
      primaryType.toString(),
      message,
      types,
      isV4,
    ).toString('hex');

    const hdPath = await this.unlockAccountByAddress(withAccount);

    let payload: {
      v: number;
      s: string;
      r: string;
    };
    try {
      await this.makeApp();

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      payload = await this.eth!.signEIP712HashedMessage(
        hdPath,
        domainSeparatorHex,
        hashStructMessageHex,
      );
    } catch (error) {
      throw this.ledgerErrToMessage(error);
    } finally {
      await this.cleanUp();
    }

    const v1 = payload.v - 27;
    const v2 = v1.toString(16);
    const v = v2.length < 2 ? `0${v2}` : v2;

    const signature = `0x${payload.r}${payload.s}${v}`;
    const addressSignedWith = sigUtil.recoverTypedSignature_v4({
      data,
      sig: signature,
    });
    if (
      ethUtil.toChecksumAddress(addressSignedWith) !==
      ethUtil.toChecksumAddress(withAccount)
    ) {
      throw new Error('Ledger: The signature doesnt match the right address');
    }
    return signature;
  }

  public async signTransaction(address: string, tx: any) {
    let rawTxHex;
    // transactions built with older versions of ethereumjs-tx have a
    // getChainId method that newer versions do not. Older versions are mutable
    // while newer versions default to being immutable. Expected shape and type
    // of data for v, r and s differ (Buffer (old) vs BN (new))
    if (typeof tx.getChainId === 'function') {
      // In this version of ethereumjs-tx we must add the chainId in hex format
      // to the initial v value. The chainId must be included in the serialized
      // transaction which is only communicated to ethereumjs-tx in this
      // value. In newer versions the chainId is communicated via the 'Common'
      // object.
      tx.v = ethUtil.bufferToHex(tx.getChainId());
      tx.r = '0x00';
      tx.s = '0x00';

      rawTxHex = tx.serialize().toString('hex');

      const payload = await this._signTransaction(address, rawTxHex);

      tx.v = Buffer.from(payload.v, 'hex');
      tx.r = Buffer.from(payload.r, 'hex');
      tx.s = Buffer.from(payload.s, 'hex');

      const valid = tx.verifySignature();
      if (valid) {
        return tx;
      }

      throw new Error('Ledger: The transaction signature is not valid');
    }

    // The below `encode` call is only necessary for legacy transactions, as `getMessageToSign`
    // calls `rlp.encode` internally for non-legacy transactions. As per the "Transaction Execution"
    // section of the ethereum yellow paper, transactions need to be "well-formed RLP, with no additional
    // trailing bytes".

    // Note also that `getMessageToSign` will return valid RLP for all transaction types, whereas the
    // `serialize` method will not for any transaction type except legacy. This is because `serialize` includes
    // empty r, s and v values in the encoded rlp. This is why we use `getMessageToSign` here instead of `serialize`.
    const messageToSign = tx.getMessageToSign(false);

    rawTxHex = Buffer.isBuffer(messageToSign)
      ? messageToSign.toString('hex')
      : ethUtil.rlp.encode(messageToSign).toString('hex');

    const payload = await this._signTransaction(address, rawTxHex);

    // Because tx will be immutable, first get a plain javascript object that
    // represents the transaction. Using txData here as it aligns with the
    // nomenclature of ethereumjs/tx.
    const txData = tx.toJSON();
    // The fromTxData utility expects a type to support transactions with a type other than 0
    txData.type = tx.type;
    // The fromTxData utility expects v,r and s to be hex prefixed
    txData.v = ethUtil.addHexPrefix(payload.v);
    txData.r = ethUtil.addHexPrefix(payload.r);
    txData.s = ethUtil.addHexPrefix(payload.s);
    // Adopt the 'common' option from the original transaction and set the
    // returned object to be frozen if the original is frozen.
    const newOrMutatedTx = TransactionFactory.fromTxData(txData, {
      common: tx.common,
      freeze: Object.isFrozen(tx),
    });
    const valid = newOrMutatedTx.verifySignature();
    if (valid) {
      return newOrMutatedTx;
    }

    throw new Error('Ledger: The transaction signature is not valid');
  }

  private async _signTransaction(address: string, rawTxHex: string) {
    const hdPath = await this.unlockAccountByAddress(address);

    try {
      await this.makeApp();

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return this.eth!.signTransaction(hdPath, rawTxHex);
    } catch (error) {
      throw this.ledgerErrToMessage(error);
    } finally {
      await this.cleanUp();
    }
  }

  private async unlockAccountByAddress(address: string) {
    const checksummedAddress = ethUtil.toChecksumAddress(address);
    if (!Object.keys(this.accountDetails).includes(checksummedAddress)) {
      throw new Error(
        `Ledger: Account for address '${checksummedAddress}' not found`,
      );
    }
    const { hdPath } = this.accountDetails[checksummedAddress];
    const unlockedAddress = await this.unlock(hdPath, false);

    // unlock resolves to the address for the given hdPath as reported by the ledger device
    // if that address is not the requested address, then this account belongs to a different device or seed
    if (unlockedAddress.toLowerCase() !== address.toLowerCase()) {
      throw new Error(
        `Ledger: Account ${address} does not belong to the connected device`,
      );
    }
    return hdPath;
  }

  private async __getPage(increment: number) {
    this.page += increment;

    if (this.page <= 0) {
      this.page = 1;
    }
    const from = (this.page - 1) * this.perPage;
    const to = from + this.perPage;

    await this.unlock();
    let accounts;
    if (this._isLedgerLiveHdPath()) {
      accounts = await this._getAccountsBIP44(from, to);
    } else {
      accounts = this._getAccountsLegacy(from, to);
    }
    return accounts;
  }

  private async _getAccountsBIP44(from: number, to: number) {
    const accounts = [];

    for (let i = from; i < to; i++) {
      const path = this._getPathForIndex(i);
      const address = await this.unlock(path);
      const valid = this.implementFullBIP44
        ? await this._hasPreviousTransactions(address)
        : true;
      accounts.push({
        address,
        balance: null,
        index: i,
      });
      // PER BIP44
      // "Software should prevent a creation of an account if
      // a previous account does not have a transaction history
      // (meaning none of its addresses have been used before)."
      if (!valid) {
        break;
      }
    }
    return accounts;
  }

  private _getAccountsLegacy(from: number, to: number) {
    const accounts = [];

    for (let i = from; i < to; i++) {
      const address = this._addressFromIndex(i);
      accounts.push({
        address,
        balance: null,
        index: i,
      });
      this.paths[ethUtil.toChecksumAddress(address)] = i;
    }
    return accounts;
  }

  private _addressFromIndex(i: number) {
    const dkey = this.hdk.derive(`${pathBase}/${i}`);
    const address = ethUtil
      .publicToAddress(dkey.publicKey, true)
      .toString('hex');

    return ethUtil.toChecksumAddress(`0x${address}`);
  }

  private _getPathForIndex(index: number) {
    // Check if the path is BIP 44 (Ledger Live)
    return this._isLedgerLiveHdPath()
      ? `m/44'/60'/${index}'/0/0`
      : `${this.hdPath}/${index}`;
  }

  private _isLedgerLiveHdPath() {
    return this.hdPath === `m/44'/60'/0'/0/0`;
  }

  private async _hasPreviousTransactions(address: string) {
    // TODO: Only possible option in eth-ledger-brigde-keyring
    // Definitely needs reviewing
    const apiUrl = NETWORK_API_URLS.mainnet;
    const response = await window.fetch(
      `${apiUrl}/api?module=account&action=txlist&address=${address}&tag=latest&page=1&offset=1`,
    );
    const parsedResponse = await response.json();
    if (parsedResponse.status !== '0' && parsedResponse.result.length > 0) {
      return true;
    }
    return false;
  }

  private async makeApp() {
    this.transport = await TransportNodeHid.open('');

    this.eth = new Eth(this.transport);
  }

  private async unlock(hdPath = '', updateHdk = true) {
    if (this.isUnlocked() && !hdPath) {
      return Promise.resolve('already unlocked');
    }
    const path = hdPath ? hdPath.replace('m/', '') : this.hdPath;

    let addressData: {
      publicKey: string;
      address: string;
      chainCode?: string;
    };
    try {
      await this.makeApp();

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      addressData = await this.eth!.getAddress(path, false, true);
    } catch (error) {
      throw this.ledgerErrToMessage(error);
    } finally {
      await this.cleanUp();
    }

    if (updateHdk) {
      this.hdk.publicKey = Buffer.from(addressData.publicKey, 'hex');
      if (addressData.chainCode) {
        this.hdk.chainCode = Buffer.from(addressData.chainCode, 'hex');
      }
    }

    return addressData.address;
  }

  // This is likely code from an old migration, as accountIndexes is no longer being generated
  private _migrateAccountDetails(opts: Partial<LedgerKeyringProperties>) {
    if (this._isLedgerLiveHdPath() && opts.accountIndexes) {
      for (const account of Object.keys(opts.accountIndexes)) {
        this.accountDetails[account] = {
          bip44: true,
          hdPath: this._getPathForIndex(opts.accountIndexes[account]),
        };
      }
    }

    // try to migrate non-LedgerLive accounts too
    if (!this._isLedgerLiveHdPath()) {
      this.accounts
        .filter(
          (account) =>
            !Object.keys(this.accountDetails).includes(
              ethUtil.toChecksumAddress(account),
            ),
        )
        .forEach((account) => {
          try {
            this.accountDetails[ethUtil.toChecksumAddress(account)] = {
              bip44: false,
              hdPath: this._pathFromAddress(account),
            };
          } catch (e) {
            console.log(`failed to migrate account ${account}`);
          }
        });
    }
  }

  private _pathFromAddress(address: string) {
    const checksummedAddress = ethUtil.toChecksumAddress(address);
    let index = this.paths[checksummedAddress];
    if (typeof index === 'undefined') {
      for (let i = 0; i < MAX_INDEX; i++) {
        if (checksummedAddress === this._addressFromIndex(i)) {
          index = i;
          break;
        }
      }
    }

    if (typeof index === 'undefined') {
      throw new Error('Unknown address');
    }
    return this._getPathForIndex(index);
  }

  private async cleanUp() {
    this.eth = undefined;
    if (this.transport) {
      await this.transport.close();
      this.transport = undefined;
    }
  }

  private ledgerErrToMessage(err: any) {
    const isU2FError = Boolean(err) && Boolean(err.metaData);

    // https://developers.yubico.com/U2F/Libraries/Client_error_codes.html
    if (isU2FError) {
      if (err.metaData.code === 5) {
        return new Error('LEDGER_TIMEOUT');
      }
      return err.metaData.type;
    }

    const isWrongAppError = String(err.message || err).includes('6804');
    if (isWrongAppError) {
      return new Error('LEDGER_WRONG_APP');
    }

    const isLedgerLockedError = err.message?.includes('OpenFailed');
    const isStringError = typeof err === 'string';
    if (isLedgerLockedError || (isStringError && err.includes('6801'))) {
      return new Error('LEDGER_LOCKED');
    }

    const isErrorWithId =
      // eslint-disable-next-line no-prototype-builtins
      err.hasOwnProperty('id') && err.hasOwnProperty('message');
    if (isErrorWithId) {
      // Browser doesn't support U2F
      if (err.message.includes('U2F not supported')) {
        return new Error('U2F_NOT_SUPPORTED');
      }
    }

    // Other
    return err;
  }
}
