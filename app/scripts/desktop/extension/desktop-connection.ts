import { Duplex } from 'stream';
import EventEmitter from 'events';
import endOfStream from 'end-of-stream';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
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
} from '../../../../shared/constants/desktop';
import { browser } from '../browser/browser-polyfill';
import { ConnectionType, RemotePortData, State } from '../types/background';
import { ClientId, VersionCheckResult } from '../types/desktop';
import { registerResponseStream } from '../browser/browser-proxy';
import { uuid } from '../utils/utils';
import { waitForMessage } from '../utils/stream';
import { ExtensionPairing } from '../shared/pairing';
import * as RawState from '../utils/raw-state';
import { ExtensionVersionCheck } from '../shared/version-check';

export default class DesktopConnection extends EventEmitter {
  private stream: Duplex;

  private multiplex: ObjectMultiplex;

  private newConnectionStream: Duplex;

  private endConnectionStream: Duplex;

  private stateStream: Duplex;

  private disableStream: Duplex;

  private versionCheck: ExtensionVersionCheck;

  private extensionPairing: ExtensionPairing;

  public constructor(stream: Duplex) {
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

    const pairingStream = this.multiplex.createStream(CLIENT_ID_PAIRING);
    this.extensionPairing = new ExtensionPairing(pairingStream, () =>
      this.transferState(),
    ).init();

    const versionStream = this.multiplex.createStream(CLIENT_ID_VERSION);
    this.versionCheck = new ExtensionVersionCheck(versionStream);

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
   * @param uiStream - A paused stream to communicate with the remote port.
   */
  public async createStream(
    remotePort: any,
    connectionType: ConnectionType,
    uiStream: Duplex,
  ) {
    const clientId = this.generateClientId();
    const clientStream = this.multiplex.createStream(clientId);

    uiStream.pipe(clientStream).pipe(uiStream as any);

    endOfStream(uiStream, () => {
      this.onUIStreamEnd(clientId, clientStream);
    });

    this.sendNewConnectionMessage(remotePort, clientId, connectionType);

    uiStream.resume();
  }

  public async transferState() {
    const stateToTransfer = await RawState.getAndUpdateDesktopState({
      desktopEnabled: true,
    });

    this.stateStream.write(stateToTransfer);

    await waitForMessage(this.stateStream, (data) =>
      Promise.resolve(data === MESSAGE_ACKNOWLEDGE),
    );

    log.debug('Sent extension state to desktop');
  }

  public async checkVersions(): Promise<VersionCheckResult> {
    return await this.versionCheck.check();
  }

  public async checkPairingKey(): Promise<boolean> {
    return await this.extensionPairing.isPairingKeyMatch();
  }

  private async onDisable(state: State) {
    log.debug('Received desktop disable message');

    if (state) {
      await RawState.set(state);
      log.debug('Synchronised with final desktop state');
    } else {
      await RawState.setDesktopState({
        desktopEnabled: false,
        pairingKey: undefined,
      });
      log.debug('Disabled desktop mode');
    }

    this.disableStream?.write(MESSAGE_ACKNOWLEDGE);

    this.restart();
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

    await RawState.set(rawState);

    log.debug('Synchronised state with desktop');
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

  private async restart() {
    log.debug('Restarting extension');
    browser.runtime.reload();
  }

  private generateClientId(): ClientId {
    return uuid();
  }
}
