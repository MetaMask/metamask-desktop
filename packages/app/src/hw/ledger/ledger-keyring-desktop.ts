import Eth from '@ledgerhq/hw-app-eth';
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid-noevents';

import { BaseLedgerKeyring } from '@metamask/eth-ledger-bridge-keyring';

class LedgerKeyringDesktop extends BaseLedgerKeyring {
  private eth: Eth | undefined;

  private transport: TransportNodeHid | undefined;

  public init() {
    return Promise.resolve();
  }

  public destroy() {
    return Promise.resolve();
  }

  async _getPublicKey({ hdPath }: any) {
    try {
      await this.makeApp();

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return this.eth!.getAddress(hdPath, false, true);
    } catch (error) {
      throw this.ledgerErrToMessage(error);
    } finally {
      await this.cleanUp();
    }
  }

  async _deviceSignTransaction({ hdPath, rawTxHex }: any) {
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

  async _deviceSignMessage({ hdPath, message }: any) {
    try {
      await this.makeApp();

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return this.eth!.signPersonalMessage(hdPath, message);
    } catch (error) {
      throw this.ledgerErrToMessage(error);
    } finally {
      await this.cleanUp();
    }
  }

  async _deviceSignTypedData({
    hdPath,
    domainSeparatorHex,
    hashStructMessageHex,
  }: any) {
    try {
      await this.makeApp();

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return this.eth!.signEIP712HashedMessage(
        hdPath,
        domainSeparatorHex,
        hashStructMessageHex,
      );
    } catch (error) {
      throw this.ledgerErrToMessage(error);
    } finally {
      await this.cleanUp();
    }
  }

  private async makeApp() {
    this.transport = await TransportNodeHid.open('');

    this.eth = new Eth(this.transport);
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

export { LedgerKeyringDesktop };
