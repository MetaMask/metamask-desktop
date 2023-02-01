import { Duplex } from 'stream';
import EventEmitter from 'events';
import log from 'loglevel';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import ObjectMultiplex from 'obj-multiplex';
import { acknowledge } from '@metamask/desktop/dist/utils/stream';
import {
  PairingKeyRequestMessage,
  PairingKeyResponseMessage,
  PairingResultMessage,
} from '@metamask/desktop/dist/types';
import * as rawState from '@metamask/desktop/dist/utils/state';

export class DesktopPairing extends EventEmitter {
  private requestStream: Duplex;

  private keyStream: Duplex;

  constructor(stream: Duplex) {
    super();

    const streams = this.createStreams(stream);

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

  private createStreams(stream: Duplex) {
    const multiplex = new ObjectMultiplex();
    const requestStream = multiplex.createStream('request');
    const keyStream = multiplex.createStream('key');

    stream.pipe(multiplex).pipe(stream);

    return { requestStream, keyStream };
  }
}
