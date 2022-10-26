import { Duplex } from 'stream';
import EventEmitter from 'events';
import log from 'loglevel';
import TOTP from '../utils/totp';
import { PairingMessage } from '../types/message';
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
    this.stream.on('data', (data: PairingMessage) => this.onMessage(data));
    return this;
  }

  private async onMessage(pairingMessage: PairingMessage) {
    log.debug('Received pairing message', pairingMessage);

    if (!pairingMessage?.otp) {
      return;
    }

    const isValidOTP = TOTP.validate(pairingMessage?.otp);

    if (!isValidOTP) {
      log.debug('Received invalid OTP');
      this.stream.write({ ...pairingMessage, isPaired: false });
      return;
    }

    // Generate random pairing key and save it in state
    await rawState.setDesktopState({
      desktopEnabled: true,
      pairingKey: await createKey(),
    });

    this.stream.write({ ...pairingMessage, isPaired: true });
    await waitForMessage(this.stream, (data) =>
      Promise.resolve(data === MESSAGE_ACKNOWLEDGE),
    );
    log.debug('Saved pairing key');

    await this.transferState();

    browser.runtime.reload();

    log.debug('Paired with desktop');
  }

  public async isPairingKeyMatch(): Promise<boolean> {
    log.debug('checking pairing key');
    const desktopController = (await rawState.get()).data?.DesktopController;
    const extensionPairingKey = desktopController.pairingKey;

    this.stream.write({ pairingKey: extensionPairingKey });

    const response = await waitForMessage<PairingMessage>(this.stream);

    log.debug('Completed pairing key check', response.isPaired);
    return response.isPaired as boolean;
  }
}

export class DesktopPairing extends EventEmitter {
  private stream: Duplex;

  constructor(stream: Duplex) {
    super();
    this.stream = stream;
  }

  public init() {
    this.stream.on('data', (data: PairingMessage) =>
      data.pairingKey ? this.onCheckPairingKey(data) : this.onMessage(data),
    );
    return this;
  }

  public async submitOTP(otp: string) {
    log.debug('Received OTP', otp);
    this.stream.write({ otp, isPaired: false });
  }

  private async onCheckPairingKey(pairingMessage: PairingMessage) {
    const desktopController = (await rawState.get()).data?.DesktopController;
    const extensionPairingKey = desktopController.pairingKey;
    log.debug('Comparing desktop and extension pairing keys');

    const isPaired = pairingMessage.pairingKey === extensionPairingKey;

    const response: PairingMessage = {
      ...pairingMessage,
      isPaired,
      pairingKey: pairingMessage.pairingKey,
    };
    this.stream.write(response);
  }

  private async onMessage(pairingMessage: PairingMessage) {
    log.debug('Received pairing message', pairingMessage);

    if (pairingMessage?.isPaired) {
      await rawState.setDesktopState({ desktopEnabled: true });
      this.stream.write(MESSAGE_ACKNOWLEDGE);
      this.emit('desktop-paired-restart');
      return;
    }

    log.debug('Submitted OTP was invalid');
    this.emit('invalid-otp', false);
  }
}
