import { Duplex, Readable } from 'stream';
import EventEmitter from 'events';
import endOfStream from 'end-of-stream';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import ObjectMultiplex from 'obj-multiplex';
import log from './utils/log';
import { Pairing } from './pairing';
import { VersionCheck } from './version-check';
import { uuid } from './utils/utils';
import {
  acknowledge,
  addDataListener,
  waitForAcknowledge,
} from './utils/stream';
import {
  addPairingKeyToRawState,
  getAndUpdateDesktopState,
  removePairingKeyFromRawState,
  setDesktopState,
  setRawState,
} from './utils/state';
import {
  ConnectionType,
  RemotePortData,
  ClientId,
  RawState,
  VersionCheckResult,
  RemotePort,
  PairingKeyStatus,
} from './types';
import {
  CLIENT_ID_BROWSER_CONTROLLER,
  CLIENT_ID_END_CONNECTION,
  CLIENT_ID_NEW_CONNECTION,
  CLIENT_ID_STATE,
  CLIENT_ID_DISABLE,
  CLIENT_ID_VERSION,
  CLIENT_ID_PAIRING,
} from './constants';
import { browser, registerResponseStream } from './browser';

export default class DesktopConnection extends EventEmitter {
  private stream: Duplex;

  private multiplex: ObjectMultiplex;

  private newConnectionStream: Duplex;

  private endConnectionStream: Duplex;

  private stateStream: Duplex;

  private disableStream: Duplex;

  private browserControllerStream: Duplex;

  private versionCheck: VersionCheck;

  private extensionPairing: Pairing;

  private extensionVersion: string;

  private paired = false;

  public constructor(stream: Duplex, extensionVersion: string) {
    super();

    this.stream = stream;
    this.extensionVersion = extensionVersion;
    this.multiplex = new ObjectMultiplex();

    this.newConnectionStream = this.multiplex.createStream(
      CLIENT_ID_NEW_CONNECTION,
    );

    this.endConnectionStream = this.multiplex.createStream(
      CLIENT_ID_END_CONNECTION,
    );

    this.stateStream = this.multiplex.createStream(CLIENT_ID_STATE);
    this.addPairedOnlyDataListener(this.stateStream, (data: RawState) => {
      this.onDesktopState(data);
    });

    this.disableStream = this.multiplex.createStream(CLIENT_ID_DISABLE);
    this.addPairedOnlyDataListener(this.disableStream, (data: RawState) =>
      this.onDisable(data),
    );

    const pairingStream = this.multiplex.createStream(CLIENT_ID_PAIRING);
    this.extensionPairing = new Pairing(pairingStream, () =>
      this.transferState(),
    ).init();

    const versionStream = this.multiplex.createStream(CLIENT_ID_VERSION);
    this.versionCheck = new VersionCheck(versionStream, this.extensionVersion);

    this.browserControllerStream = this.multiplex.createStream(
      CLIENT_ID_BROWSER_CONTROLLER,
    );

    this.stream.pipe(this.multiplex).pipe(this.stream);
  }

  public setPaired() {
    this.paired = true;
    registerResponseStream(this.browserControllerStream);
  }

  /**
   * Creates a connection with the MetaMask Desktop via a multiplexed stream.
   *
   * @param remotePort - The port provided by a new context.
   * @param connectionType - Whether or not the new context is external (page or other extension).
   * @param uiStream - A paused stream to communicate with the remote port.
   */
  public async createStream(
    remotePort: RemotePort,
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
    const stateToTransfer = await getAndUpdateDesktopState({
      desktopEnabled: true,
    });

    const filteredState = removePairingKeyFromRawState(stateToTransfer);

    this.stateStream.write(filteredState);

    await waitForAcknowledge(this.stateStream);

    log.debug('Sent extension state to desktop');
  }

  public async checkVersions(): Promise<VersionCheckResult> {
    return await this.versionCheck.check();
  }

  public async checkPairingKey(): Promise<PairingKeyStatus> {
    return await this.extensionPairing.checkPairingKeyMatch();
  }

  private async onDisable(state: RawState) {
    log.debug('Received desktop disable message');

    if (state) {
      await setRawState(state);
      log.debug('Synchronised with final desktop state');
    } else {
      await setDesktopState({
        desktopEnabled: false,
        pairingKey: undefined,
        pairingKeyHash: undefined,
      });
      log.debug('Disabled desktop mode');
    }

    acknowledge(this.disableStream);

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

  private async onDesktopState(rawState: RawState) {
    const newRawState = await addPairingKeyToRawState(rawState);

    await setRawState(newRawState);

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

  private addPairedOnlyDataListener(
    stream: Readable,
    listener: (data: any) => void,
  ) {
    addDataListener(stream, (data: any) => {
      if (!this.paired) {
        log.debug('Ignoring message as not paired');
        return;
      }

      listener(data);
    });
  }

  private async restart() {
    log.debug('Restarting extension');
    browser.runtime.reload();
  }

  private generateClientId(): ClientId {
    return uuid();
  }
}
