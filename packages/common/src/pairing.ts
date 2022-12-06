import { Duplex } from 'stream';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import ObjectMultiplex from 'obj-multiplex';
import log from './utils/log';
import { MESSAGE_ACKNOWLEDGE } from './constants';
import { waitForAcknowledge, waitForMessage } from './utils/stream';
import TOTP from './utils/totp';
import { createKey } from './encryption/symmetric';
import { hashString } from './utils/crypto';
import {
  PairingKeyRequestMessage,
  PairingKeyResponseMessage,
  PairingKeyStatus,
  PairingRequestMessage,
  PairingResultMessage,
} from './types';
import * as rawState from './utils/state';
import { browser } from './browser';

export class Pairing {
  private requestStream: Duplex;

  private keyStream: Duplex;

  private transferState: () => Promise<void>;

  constructor(stream: Duplex, transferState: () => Promise<void>) {
    const streams = this.createStreams(stream);

    this.requestStream = streams.requestStream;
    this.keyStream = streams.keyStream;
    this.transferState = transferState;
  }

  public static generateOTP(): string {
    const value = TOTP.generate() as string;
    log.debug('Generated OTP', value);
    return value;
  }

  public init() {
    this.requestStream.on('data', (data: PairingRequestMessage | string) => {
      if (data === MESSAGE_ACKNOWLEDGE) {
        return;
      }

      this.onRequestMessage(data as PairingRequestMessage);
    });

    return this;
  }

  public async checkPairingKeyMatch(): Promise<PairingKeyStatus> {
    log.debug('Validating pairing key');

    const requestPairingKey: PairingKeyRequestMessage = {
      isRequestPairingKey: true,
    };

    this.keyStream.write(requestPairingKey);

    // Wait for desktop pairing key
    const response = await waitForMessage<PairingKeyResponseMessage>(
      this.keyStream,
    );

    const desktopPairingKey = response.pairingKey;

    if (!desktopPairingKey) {
      log.debug('Desktop has no pairing key');
      return PairingKeyStatus.MISSING;
    }

    const desktopPairingKeyHash = await hashString(desktopPairingKey, {
      isHex: true,
    });

    const extensionPairingKeyHash = (await rawState.getDesktopState())
      .pairingKeyHash;

    const isMatch = extensionPairingKeyHash === desktopPairingKeyHash;

    log.debug('Completed pairing key check', isMatch);

    if (isMatch) {
      return PairingKeyStatus.MATCH;
    }
    return PairingKeyStatus.NO_MATCH;
  }

  private async onRequestMessage(pairingRequest: PairingRequestMessage) {
    log.debug('Received pairing request message', pairingRequest);

    const isValidOTP = TOTP.validate(pairingRequest.otp);

    if (!isValidOTP) {
      log.debug('Received invalid OTP');

      const pairingResultMessage: PairingResultMessage = {
        isDesktopEnabled: false,
      };

      this.requestStream.write(pairingResultMessage);
      return;
    }

    const pairingKey = await createKey();
    const pairingKeyHash = await hashString(pairingKey, { isHex: true });

    await rawState.setDesktopState({
      desktopEnabled: true,
      pairingKeyHash,
    });

    const pairingResultMessage: PairingResultMessage = {
      isDesktopEnabled: true,
      pairingKey,
    };

    this.requestStream.write(pairingResultMessage);

    await waitForAcknowledge(this.requestStream);

    log.debug('Saved pairing key', { pairingKey, pairingKeyHash });

    await this.transferState();

    browser.runtime.reload();

    log.debug('Paired with desktop');
  }

  private createStreams(stream: Duplex) {
    const multiplex = new ObjectMultiplex();
    const requestStream = multiplex.createStream('request');
    const keyStream = multiplex.createStream('key');

    stream.pipe(multiplex).pipe(stream);

    return { requestStream, keyStream };
  }
}
