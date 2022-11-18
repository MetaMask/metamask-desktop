import { Duplex, EventEmitter } from 'stream';
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
  acknowledge,
  cfg,
  clear,
  waitForAcknowledge,
  ConnectionType,
  ClientId,
  RawState,
  EndConnectionMessage,
  NewConnectionMessage,
  set,
  addPairingKey,
  removePairingKey,
  getAndUpdateDesktopState,
} from '@metamask/desktop';
import {
  registerRequestStream,
  unregisterRequestStream,
} from '../browser/node-browser';
import { DesktopPairing } from '../shared/pairing';
import { DesktopVersionCheck } from '../shared/version-check';

const RawStateUtils = {
  addPairingKey,
  clear,
  getAndUpdateDesktopState,
  removePairingKey,
  set,
};

export default class ExtensionConnection extends EventEmitter {
  private stream: Duplex;

  private connections: NewConnectionMessage[];

  private clientStreams: { [clientId: ClientId]: Duplex };

  private multiplex: ObjectMultiplex;

  private newConnectionStream: Duplex;

  private endConnectionStream: Duplex;

  private stateStream: Duplex;

  private browserControllerStream: Duplex;

  private disableStream: Duplex;

  private hasBeenInitializedWithExtensionState?: boolean;

  private pairing: DesktopPairing;

  public constructor(stream: Duplex) {
    super();

    this.stream = stream;
    this.connections = [];
    this.clientStreams = {};
    this.multiplex = new ObjectMultiplex();

    this.newConnectionStream = this.multiplex.createStream(
      CLIENT_ID_NEW_CONNECTION,
    );
    this.newConnectionStream.on('data', (data: NewConnectionMessage) =>
      this.onNewConnectionMessage(data),
    );

    this.endConnectionStream = this.multiplex.createStream(
      CLIENT_ID_END_CONNECTION,
    );
    this.endConnectionStream.on('data', (data: EndConnectionMessage) =>
      this.onEndConnectionMessage(data),
    );

    this.stateStream = this.multiplex.createStream(CLIENT_ID_STATE);
    this.stateStream.on('data', (data: any) => this.onExtensionState(data));

    this.browserControllerStream = this.multiplex.createStream(
      CLIENT_ID_BROWSER_CONTROLLER,
    );
    registerRequestStream(this.browserControllerStream);

    this.disableStream = this.multiplex.createStream(CLIENT_ID_DISABLE);

    const pairingStream = this.multiplex.createStream(CLIENT_ID_PAIRING);
    this.pairing = new DesktopPairing(pairingStream).init();

    const versionStream = this.multiplex.createStream(CLIENT_ID_VERSION);
    new DesktopVersionCheck(versionStream).init();

    this.stream.pipe(this.multiplex).pipe(this.stream);
  }

  public getPairing(): DesktopPairing {
    return this.pairing;
  }

  public disconnect() {
    unregisterRequestStream();

    Object.values(this.clientStreams).forEach((clientStream) =>
      clientStream.end(),
    );
  }

  public transferState(rawState: RawState) {
    if (!this.canTransferState()) {
      log.debug(
        'Cannot transfer state to extension as waiting for initial state from extension',
      );
      return;
    }

    const filteredState = RawStateUtils.removePairingKey(rawState);

    this.stateStream.write(filteredState);

    log.debug('Sent state to extension');
  }

  public async disable() {
    log.debug('Desktop disabled');

    const shouldTransfer = this.canTransferState();

    this.hasBeenInitializedWithExtensionState = false;

    const message = shouldTransfer
      ? await RawStateUtils.getAndUpdateDesktopState({ desktopEnabled: false })
      : undefined;

    this.disableStream.write(message);

    await waitForAcknowledge(this.disableStream);

    log.debug('Sent disable request to extension');

    await RawStateUtils.clear();

    log.debug('Removed all desktop state');

    this.emit('disable');
  }

  private onNewConnectionMessage(data: NewConnectionMessage) {
    log.debug('Received new connection message', {
      clientId: data.clientId,
      name: data.remotePort.name,
      url: data.remotePort.sender.url,
      connectionType: data.connectionType,
    });

    const { clientId, connectionType } = data;

    const stream = this.multiplex.createStream(clientId);
    this.clientStreams[clientId] = stream;

    endOfStream(stream, () => this.onClientStreamEnd(clientId));

    const connectArgs = {
      ...data.remotePort,
      stream,
      onMessage: {
        addListener: () => undefined,
      },
    };

    switch (connectionType) {
      case ConnectionType.INTERNAL:
        this.emit('connect-remote', connectArgs);
        break;

      case ConnectionType.EXTERNAL:
        this.emit('connect-external', connectArgs);
        break;

      default:
        throw new Error(`Connection type not supported - ${connectionType}`);
    }

    this.connections.push(data);

    this.emit('connection-update', this.connections);
  }

  private onEndConnectionMessage(data: EndConnectionMessage) {
    log.debug('Received end connection message', data);
    this.clientStreams[data.clientId]?.end();
  }

  private onClientStreamEnd(clientId: ClientId) {
    log.debug('Client stream ended', clientId);

    const index = this.connections.findIndex(
      (connection) => connection.clientId === clientId,
    );

    this.connections.splice(index, 1);

    delete this.clientStreams[clientId];
    delete this.multiplex._substreams[clientId];

    this.emit('connection-update', this.connections);
  }

  private async onExtensionState(data: RawState) {
    log.debug('Received extension state');

    const newRawState = await RawStateUtils.addPairingKey(data);

    if (!cfg().isTest) {
      await RawStateUtils.set(newRawState);
    }

    acknowledge(this.stateStream);

    this.hasBeenInitializedWithExtensionState = true;

    log.debug('Synchronised with extension state');

    this.emit('restart');
    this.emit('paired');
  }

  private canTransferState() {
    return this.hasBeenInitializedWithExtensionState;
  }
}
