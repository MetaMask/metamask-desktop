import { Duplex } from 'stream';
import EventEmitter from 'events';
import log from 'loglevel';
import TOTP from '../utils/totp';
import {
  PairingKeyRequestMessage,
  PairingKeyResponseMessage,
  PairingRequestMessage,
  PairingResultMessage,
} from '../types/message';
import * as rawState from '../utils/raw-state';
import { browser } from '../browser/browser-polyfill';
import { waitForMessage } from '../utils/stream';
import { MESSAGE_ACKNOWLEDGE } from '../../../../shared/constants/desktop';
import { createKey } from '../encryption/symmetric-encryption';

export class ExtensionPairing {
  private stream: Duplex;

  private transferState: () => Promise<void>;

  constructor(stream: Duplex, transferState: () => Promise<void>) {
    this.stream = stream;
    this.transferState = transferState;
  }

  public static generateOTP(): string {
    const value = TOTP.generate() as string;
    log.debug('Generated OTP', value);
    return value;
  }

  public init() {
    this.stream.on('data', (data: PairingRequestMessage) =>
      this.onMessage(data),
    );
    return this;
  }

  public async isPairingKeyMatch(): Promise<boolean> {
    const extensionPairingKey = (await rawState.getDesktopState()).pairingKey;
    const requestPairingKey: PairingKeyRequestMessage = {
      isRequestPairingKey: true,
    };
    this.stream.write(requestPairingKey);

    // wait for desktop pairing key
    const response = await waitForMessage<PairingKeyResponseMessage>(
      this.stream,
    );

    const isDesktopEnabled = extensionPairingKey === response.pairingKey;

    log.debug('Completed pairing key check', isDesktopEnabled);
    return isDesktopEnabled as boolean;
  }

  private async onMessage(pairingRequestMessage: PairingRequestMessage) {
    log.debug('Received pairing message', pairingRequestMessage);

    const isValidOTP = TOTP.validate(pairingRequestMessage?.otp);

    if (!isValidOTP) {
      log.debug('Received invalid OTP');
      const pairingResultMessage: PairingResultMessage = {
        isDesktopEnabled: false,
      };
      this.stream.write(pairingResultMessage);
      return;
    }

    // Generate random pairing key and save it in state
    await rawState.setDesktopState({
      desktopEnabled: true,
      pairingKey: await createKey(),
    });

    const pairingResultMessage: PairingResultMessage = {
      isDesktopEnabled: true,
    };
    this.stream.write(pairingResultMessage);
    await waitForMessage(this.stream, (data) =>
      Promise.resolve(data === MESSAGE_ACKNOWLEDGE),
    );
    log.debug('Saved pairing key');

    await this.transferState();

    browser.runtime.reload();

    log.debug('Paired with desktop');
  }
}

export class DesktopPairing extends EventEmitter {
  private stream: Duplex;

  constructor(stream: Duplex) {
    super();
    this.stream = stream;
  }

  public init() {
    this.stream.on('data', (data: PairingResultMessage) =>
      this.onMessage(data),
    );
    return this;
  }

  public async submitOTP(otp: string) {
    log.debug('Received OTP', otp);
    this.stream.write({ otp });
  }

  private async onPairingKeyRequestMessage(
    pairingKeyRequestMessage: PairingKeyRequestMessage,
  ) {
    log.debug('Received pairing key request message', pairingKeyRequestMessage);
    const desktopPairingKey = (await rawState.getDesktopState()).pairingKey;
    log.debug('Comparing desktop and extension pairing keys');

    const response: PairingKeyResponseMessage = {
      pairingKey: desktopPairingKey,
    };
    this.stream.write(response);
  }

  private async onMessage(
    pairingMessage: PairingResultMessage | PairingKeyRequestMessage,
  ) {
    log.debug('Received pairing message', pairingMessage);

    if (this.isPairingKeyRequestMessage(pairingMessage)) {
      await this.onPairingKeyRequestMessage(pairingMessage);
      return;
    }

    if ((pairingMessage as PairingResultMessage)?.isDesktopEnabled) {
      await rawState.setDesktopState({ desktopEnabled: true });
      this.stream.write(MESSAGE_ACKNOWLEDGE);
      return;
    }

    log.debug('Submitted OTP was invalid');
    this.emit('invalid-otp', false);
  }

  private isPairingKeyRequestMessage(
    msg: PairingResultMessage | PairingKeyRequestMessage,
  ): msg is PairingKeyRequestMessage {
    return (msg as PairingKeyRequestMessage)?.isRequestPairingKey !== undefined;
  }
}
