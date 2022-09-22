import { EventEmitter } from 'events';
import * as ethUtil from 'ethereumjs-util';
import * as sigUtil from 'eth-sig-util';
import HDKey from 'hdkey';
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid-noevents';
import Eth from '@ledgerhq/hw-app-eth';
import { TransactionFactory } from '@ethereumjs/tx';

const pathBase = 'm';
const hdPathString = `${pathBase}/44'/60'/0'`;

const NETWORK_API_URLS = {
  ropsten: 'http://api-ropsten.etherscan.io',
  kovan: 'http://api-kovan.etherscan.io',
  rinkeby: 'https://api-rinkeby.etherscan.io',
  mainnet: 'https://api.etherscan.io',
};

export class LedgerBridgeKeyring extends EventEmitter {
  // Keyring type is accessed both at class level and instance level by KeyringController
  public static type = 'Ledger Hardware';

  public type = LedgerBridgeKeyring.type;

  public hdPath!: string;

  public accounts!: any[];

  public accountDetails!: { [key: string]: { bip44: boolean; hdPath: string } };

  public implementFullBIP44!: boolean;

  public page = 0;

  public perPage = 5;

  public unlockedAccount = 0;

  public network = 'mainnet';

  public hdk: any;

  public paths: any = {};

  public eth!: Eth;

  constructor(opts: any = {}) {
    super();
    this.deserialize(opts);
    this.hdk = new HDKey();
  }

  serialize() {
    return Promise.resolve({
      hdPath: this.hdPath,
      accounts: this.accounts,
      accountDetails: this.accountDetails,
      implementFullBIP44: false,
    });
  }

  deserialize(opts: any = {}) {
    // console.log('DESERIALIZE', opts);
    this.hdPath = opts.hdPath || hdPathString;
    this.accounts = opts.accounts || [];
    this.accountDetails = opts.accountDetails || {};
    // if (!opts.accountDetails) {
    //   this._migrateAccountDetails(opts);
    // }

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
    console.log('LEDGER KEYRIN - GETFIRSTPAGE');
    this.page = 0;
    return this.__getPage(1);
  }

  public getNextPage() {
    console.log('LEDGER KEYRIN - GETNEXTPAGE');
    return this.__getPage(1);
  }

  public getPreviousPage() {
    console.log('LEDGER KEYRIN - GETPREVIOUSPAGE');
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
    console.log('LEDGER KEYRING - SETACCOUNTTOUNLOCK', index);
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

  public signMessage(withAccount: string, data: string) {
    return this.signPersonalMessage(withAccount, data);
  }

  // For personal_sign, we need to prefix the message:
  public async signPersonalMessage(withAccount: string, message: string) {
    console.log('SIGN 1', { withAccount, message });
    const hdPath = await this.unlockAccountByAddress(withAccount);

    console.log('SIGN 2', { hdPath });

    const payload = await this.eth.signPersonalMessage(
      hdPath,
      ethUtil.stripHexPrefix(message),
    );

    console.log('SIGN 3', { payload });

    const v1 = payload.v - 27;
    const v2 = v1.toString(16);
    const v = v2.length < 2 ? `0${v2}` : v2;

    const signature = `0x${payload.r}${payload.s}${v}`;
    const addressSignedWith = sigUtil.recoverPersonalSignature({
      data: message,
      sig: signature,
    });

    console.log('SIGN 4', { signature, addressSignedWith });

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

    const payload = await this.eth.signEIP712HashedMessage(
      hdPath,
      domainSeparatorHex,
      hashStructMessageHex,
    );

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

    return this.eth.signTransaction(hdPath, rawTxHex);
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
    console.log('LEDGER KEYRIN - ACCBIP44');
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
    console.log('LEDGER KEYRIN - ACCBIP44 END', accounts);
    return accounts;
  }

  private _getAccountsLegacy(from: number, to: number) {
    console.log('LEDGER KEYRIN - ACCLEGACY END');
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
    console.log('LEDGER KEYRIN - ACCLEGACY END', accounts);
    return accounts;
  }

  private _addressFromIndex(i: number) {
    const dkey = this.hdk.derive(`${pathBase}/${i}`);
    const address = ethUtil
      .publicToAddress(dkey.publicKey, true)
      .toString('hex');

    console.log('LEDGER KEYRIN - ADDRESSFROMINDEX', {
      address,
      derive: `${pathBase}/${i}`,
    });

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
    const apiUrl = this._getApiUrl();
    const response = await window.fetch(
      `${apiUrl}/api?module=account&action=txlist&address=${address}&tag=latest&page=1&offset=1`,
    );
    const parsedResponse = await response.json();
    if (parsedResponse.status !== '0' && parsedResponse.result.length > 0) {
      return true;
    }
    return false;
  }

  // TODO: Needs reviewing
  private _getApiUrl() {
    return NETWORK_API_URLS.mainnet;
  }

  private _toLedgerPath(path: string) {
    return path.toString().replace('m/', '');
  }

  private async unlock(hdPath = '', updateHdk = true) {
    console.log('LEDGER KEYRING - UNLOCK', {
      hdPath,
      updateHdk,
      unlocked: this.isUnlocked(),
    });
    if (this.isUnlocked() && !hdPath) {
      return Promise.resolve('already unlocked');
    }
    const path = hdPath ? this._toLedgerPath(hdPath) : this.hdPath;

    const transport = await TransportNodeHid.open('');

    this.eth = new Eth(transport);

    const addressData = await this.eth.getAddress(path, false, true);

    if (updateHdk) {
      this.hdk.publicKey = Buffer.from(addressData.publicKey, 'hex');
      if (addressData.chainCode) {
        this.hdk.chainCode = Buffer.from(addressData.chainCode, 'hex');
      }
    }

    console.log('LEDGER KEYRING - UNLOCK END', {
      hdPath,
      updateHdk,
      unlocked: this.isUnlocked(),
      path,
      deviceModel: transport?.deviceModel?.productName,
      address: addressData.address,
    });

    return addressData.address;
  }
}
