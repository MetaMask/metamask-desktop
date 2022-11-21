import { Duplex } from 'stream';
///: BEGIN:ONLY_INCLUDE_IN(desktopapp)
import EventEmitter from 'events';
///: END:ONLY_INCLUDE_IN
import log from 'loglevel';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import ObjectMultiplex from 'obj-multiplex';
import {
  MESSAGE_ACKNOWLEDGE,
  ///: BEGIN:ONLY_INCLUDE_IN(desktopapp)
  acknowledge,
  ///: END:ONLY_INCLUDE_IN
  waitForAcknowledge,
  waitForMessage,
} from '@metamask/desktop';
import TOTP from '../utils/totp';
import {
  PairingKeyRequestMessage,
  PairingKeyResponseMessage,
  PairingRequestMessage,
  PairingResultMessage,
} from '../types/message';
import * as rawState from '../utils/raw-state';
import { browser } from '../browser/browser-polyfill';
import { createKey } from '../encryption/symmetric-encryption';
import { hashString } from '../utils/crypto';

const createStreams = (stream: Duplex) => {
  const multiplex = new ObjectMultiplex();
  const requestStream = multiplex.createStream('request');
  const keyStream = multiplex.createStream('key');

  stream.pipe(multiplex).pipe(stream);

  return { requestStream, keyStream };
};

///: BEGIN:ONLY_INCLUDE_IN(desktopextension)
export class ExtensionPairing {
  private requestStream: Duplex;

  private keyStream: Duplex;

  private transferState: () => Promise<void>;

  constructor(stream: Duplex, transferState: () => Promise<void>) {
    const streams = createStreams(stream);

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

  public async isPairingKeyMatch(): Promise<boolean> {
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
      return false;
    }

    const desktopPairingKeyHash = await hashString(desktopPairingKey, {
      isHex: true,
    });

    const extensionPairingKeyHash = (await rawState.getDesktopState())
      .pairingKeyHash;

    const isMatch = extensionPairingKeyHash === desktopPairingKeyHash;

    log.debug('Completed pairing key check', isMatch);

    return isMatch;
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
}
///: END:ONLY_INCLUDE_IN

///: BEGIN:ONLY_INCLUDE_IN(desktopapp)
export class DesktopPairing extends EventEmitter {
  private requestStream: Duplex;

  private keyStream: Duplex;

  constructor(stream: Duplex) {
    super();

    const streams = createStreams(stream);

    this.requestStream = streams.requestStream;
    this.keyStream = streams.keyStream;
  }

  public init() {
    this.requestStream.on('data', (data: PairingResultMessage) =>
      this.onRequestMessage(data),
    );

    this.keyStream.on('data', (data: PairingKeyRequestMessage) =>
      this.onKeyMessage(data),
    );

    return this;
  }

  public async submitOTP(otp: string) {
    log.debug('Received OTP', otp);
    this.requestStream.write({ otp });
  }

  private async onRequestMessage(pairingResult: PairingResultMessage) {
    log.debug('Received pairing request response', pairingResult);

    if (!pairingResult.isDesktopEnabled) {
      log.debug('Submitted OTP was invalid');
      this.emit('invalid-otp', false);
      return;
    }

    const { pairingKey } = pairingResult;

    await rawState.setDesktopState({
      desktopEnabled: true,
      pairingKey,
    });

    log.debug('Saved pairing key', pairingKey);

    acknowledge(this.requestStream);
  }

  private async onKeyMessage(_: PairingKeyRequestMessage) {
    log.debug('Received pairing key request');

    const desktopPairingKey = (await rawState.getDesktopState()).pairingKey;

    const response: PairingKeyResponseMessage = {
      pairingKey: desktopPairingKey,
    };

    log.debug('Sending pairing key response', response);

    this.keyStream.write(response);
  }
}
///: END:ONLY_INCLUDE_IN
