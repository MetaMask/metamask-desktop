import { Duplex } from 'stream';
import EventEmitter from 'events';
import log from 'loglevel';
import * as totp from '../../../../shared/modules/totp';
import { PairingMessage } from '../types/message';
import * as rawState from '../utils/raw-state';
import { browser } from '../browser/browser-polyfill';

export class ExtensionPairing {
  private stream: Duplex;

  private transferState: () => Promise<void>;

  constructor(stream: Duplex, transferState: () => Promise<void>) {
    this.stream = stream;
    this.transferState = transferState;
  }

  public static generateOTP(): string {
    const value = totp.generate() as string;
    log.debug('Generated OTP', value);
    return value;
  }

  public init() {
    this.stream.on('data', (data: PairingMessage) => this.onMessage(data));
    return this;
  }

  private async onMessage(pairingMessage: PairingMessage) {
    log.debug('Received pairing message', pairingMessage);

    const isValidOTP = totp.validate(pairingMessage?.otp);

    if (!isValidOTP) {
      log.debug('Received invalid OTP');
      this.stream.write({ ...pairingMessage, isPaired: false });
      return;
    }

    await rawState.setDesktopState({ desktopEnabled: true });
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
    this.stream.on('data', (data: PairingMessage) => this.onMessage(data));
    return this;
  }

  public async submitOTP(otp: string) {
    log.debug('Received OTP', otp);
    this.stream.write({ otp, isPaired: false });
  }

  private async onMessage(pairingMessage: PairingMessage) {
    log.debug('Received pairing message', pairingMessage);

    if (pairingMessage?.isPaired) {
      return;
    }

    log.debug('Submitted OTP was invalid');
    this.emit('invalid-otp', false);
  }
}
