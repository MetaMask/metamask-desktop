import { Duplex, PassThrough } from 'stream';
import EventEmitter from 'events';
import PortStream from 'extension-port-stream';
import endOfStream from 'end-of-stream';
import ObjectMultiplex from 'obj-multiplex';
import log from 'loglevel';
import {
  CLIENT_ID_BROWSER_CONTROLLER,
  CLIENT_ID_END_CONNECTION,
  CLIENT_ID_NEW_CONNECTION,
  CLIENT_ID_STATE,
  CLIENT_ID_DISABLE,
  CLIENT_ID_VERSION,
  CLIENT_ID_PAIRING,
  MESSAGE_ACKNOWLEDGE,
} from '../../../shared/constants/desktop';
import { validate } from '../../../shared/modules/totp';
import { browser } from './browser/browser-polyfill';
import {
  ConnectionType,
  RemotePort,
  RemotePortData,
  State,
} from './types/background';
import { ClientId } from './types/desktop';
import { registerResponseStream } from './browser/browser-proxy';
import { uuid } from './utils/utils';
import { waitForMessage } from './utils/stream';
import { PairingMessage } from './types/message';

export default class DesktopConnection extends EventEmitter {
  private stream: Duplex;

  private multiplex: ObjectMultiplex;

  private newConnectionStream: Duplex;

  private endConnectionStream: Duplex;

  private stateStream: Duplex;

  private disableStream: Duplex;

  private pairingStream: Duplex;

  private versionStream: Duplex;

  public constructor(stream: Duplex, _: EventEmitter) {
    super();

    this.stream = stream;
    this.multiplex = new ObjectMultiplex();

    this.newConnectionStream = this.multiplex.createStream(
      CLIENT_ID_NEW_CONNECTION,
    );

    this.endConnectionStream = this.multiplex.createStream(
      CLIENT_ID_END_CONNECTION,
    );

    this.stateStream = this.multiplex.createStream(CLIENT_ID_STATE);
    this.stateStream.on('data', (rawState: State) =>
      this.onDesktopState(rawState),
    );

    this.disableStream = this.multiplex.createStream(CLIENT_ID_DISABLE);
    this.disableStream.on('data', (data: State) => this.onDisable(data));

    this.pairingStream = this.multiplex.createStream(CLIENT_ID_PAIRING);
    this.pairingStream.on('data', (data: PairingMessage) =>
      data?.isPaired ? this.restart() : this.onPairing(data),
    );

    this.versionStream = this.multiplex.createStream(CLIENT_ID_VERSION);

    const browserControllerStream = this.multiplex.createStream(
      CLIENT_ID_BROWSER_CONTROLLER,
    );

    registerResponseStream(browserControllerStream);

    this.stream.pipe(this.multiplex).pipe(this.stream);
  }

  /**
   * Creates a connection with the MetaMask Desktop via a multiplexed stream.
   *
   * @param remotePort - The port provided by a new context.
   * @param connectionType - Whether or not the new context is external (page or other extension).
   */
  public async createStream(
    remotePort: RemotePort,
    connectionType: ConnectionType,
  ) {
    const uiStream = new PortStream(remotePort as any);
    uiStream.pause();
    uiStream.on('data', (data) => this.onUIMessage(data, uiStream as any));

    // Wrapping the original UI stream allows us to intercept messages required for error handling,
    // while still pausing messages from the UI until we are connected to the desktop.
    const uiInputStream = new PassThrough({ objectMode: true });
    uiInputStream.pause();

    uiStream.pipe(uiInputStream);
    uiStream.resume();

    const clientId = this.generateClientId();
    const clientStream = this.multiplex.createStream(clientId);

    uiInputStream.pipe(clientStream).pipe(uiStream as any);

    endOfStream(uiStream, () => {
      uiInputStream.destroy();
      this.onUIStreamEnd(clientId, clientStream);
    });

    this.sendNewConnectionMessage(remotePort, clientId, connectionType);

    uiInputStream.resume();
  }

  public async transferState() {
    const state = await browser.storage.local.get();
    state.data.DesktopController.desktopEnabled = true;
    state.data.DesktopController.isPairing = false;

    this.stateStream.write(state);

    await waitForMessage(this.stateStream, (data) =>
      Promise.resolve(data === MESSAGE_ACKNOWLEDGE),
    );

    log.debug('Sent extension state to desktop');
  }

  public async getDesktopVersion(): Promise<number> {
    this.versionStream.write({});

    const versionMessage = await waitForMessage<any>(this.versionStream);
    const desktopAppVersion = versionMessage.version as number;

    return desktopAppVersion;
  }

  public disconnect() {
    this.emit('disconnect');
  }

  private async onDisable(state: State) {
    log.debug('Received desktop disable message');

    await browser.storage.local.set(state);
    log.debug('Synchronised state with desktop');

    this.disableStream?.write({});

    log.debug('Restarting extension');
    browser.runtime.reload();
  }

  private onUIStreamEnd(clientId: ClientId, clientStream: Duplex) {
    log.debug('Port stream closed', clientId);

    clientStream.end();

    if (!this.endConnectionStream) {
      log.error('End connection stream not initialised');
      return;
    }

    this.endConnectionStream.write({ clientId });
  }

  private async onDesktopState(rawState: State) {
    if (rawState === MESSAGE_ACKNOWLEDGE) {
      return;
    }

    await browser.storage.local.set(rawState);
    log.debug('Synchronised state with desktop');
  }

  private async onUIMessage(data: any, stream: Duplex) {
    const method = data.data?.method;
    const id = data.data?.id;

    if (method === 'disableDesktop') {
      await this.disable();
    }

    if (method === 'getDesktopEnabled') {
      stream.write({
        name: data.name,
        data: { jsonrpc: '2.0', result: true, id },
      });
    }
  }

  private async onPairing(pairingMessage: PairingMessage) {
    log.debug('Received desktop pairing message');

    if (validate(pairingMessage?.otp)) {
      await this.updateStateAfterPairing();

      await this.transferState();
      log.debug('Synchronised state with desktop');

      this.restart();
    } else {
      log.debug('OTP is not valid, sending acknowledged to desktop');
      this.pairingStream?.write({ ...pairingMessage, isPaired: false });
    }
  }

  private async updateStateAfterPairing() {
    const state = await browser.storage.local.get();
    state.data.DesktopController.desktopEnabled = true;
    state.data.DesktopController.isPairing = false;

    await browser.storage.local.set(state);

    log.debug('State updated after pairing');
  }

  private sendNewConnectionMessage(
    remotePort: RemotePortData,
    clientId: ClientId,
    connectionType: ConnectionType,
  ) {
    if (!this.newConnectionStream) {
      log.error('New Connection stream not initialised');
      return;
    }

    const newConnectionMessage = {
      clientId,
      connectionType,
      remotePort: {
        name: remotePort.name,
        sender: remotePort.sender,
      },
    };

    log.debug('Sending new connection message', newConnectionMessage);

    this.newConnectionStream.write(newConnectionMessage);
  }

  private async disable() {
    log.debug('Disabling desktop app');

    const rawState = await browser.storage.local.get();
    rawState.data.DesktopController.desktopEnabled = false;
    rawState.data.DesktopController.isPairing = false;

    await browser.storage.local.set(rawState);

    this.restart();
  }

  private async restart() {
    log.debug('Restarting extension');
    browser.runtime.reload();
  }

  private generateClientId(): ClientId {
    return uuid();
  }
}
