import { Duplex, EventEmitter } from 'stream';
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
import { ConnectionType } from './types/background';
import { EndConnectionMessage, NewConnectionMessage } from './types/message';
import { ClientId } from './types/desktop';
import { registerRequestStream } from './browser/node-browser';
import { waitForMessage } from './utils/stream';
import { RecordingEventEmitter } from './utils/events';
import { DesktopPairing } from './pairing';
import * as RawState from './utils/raw-state';

export default class ExtensionConnection extends EventEmitter {
  private stream: Duplex;

  private background: RecordingEventEmitter;

  private connections: NewConnectionMessage[];

  private clientStreams: { [clientId: ClientId]: Duplex };

  private multiplex: ObjectMultiplex;

  private newConnectionStream: Duplex;

  private endConnectionStream: Duplex;

  private stateStream: Duplex;

  private browserControllerStream: Duplex;

  private disableStream: Duplex;

  private versionStream: Duplex;

  private hasBeenInitializedWithExtensionState?: boolean;

  private pairing: DesktopPairing;

  public constructor(stream: Duplex, background: EventEmitter) {
    super();

    this.stream = stream;
    this.background = new RecordingEventEmitter(background);
    this.connections = [];
    this.clientStreams = {};
    this.multiplex = new ObjectMultiplex();

    this.background.on('persisted-state-update', (rawState: any) =>
      this.onPersistedStateUpdate(rawState),
    );

    this.background.on('memory-state-update', (flatState: any) =>
      this.onFlatMemStateUpdate(flatState),
    );

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

    this.versionStream = this.multiplex.createStream(CLIENT_ID_VERSION);
    this.versionStream.on('data', () => this.onVersionRequest());

    this.stream.pipe(this.multiplex).pipe(this.stream);
  }

  public getPairing(): DesktopPairing {
    return this.pairing;
  }

  public disconnect() {
    this.background.remove();
    this.multiplex.destroy();
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

  private async onExtensionState(data: any) {
    log.debug('Received extension state');

    await RawState.set(data);

    this.stateStream.write(MESSAGE_ACKNOWLEDGE);

    this.hasBeenInitializedWithExtensionState = true;

    log.debug('Synchronised with extension state');

    this.emit('extension-state');
    this.emit('paired');
  }

  private async onFlatMemStateUpdate(flatState: any) {
    if (flatState.isPairing === false && flatState.desktopEnabled === false) {
      await this.disable();
    }
  }

  private onPersistedStateUpdate(rawState: any) {
    this.transferState(rawState);
  }

  private onVersionRequest() {
    log.debug('Received version request');
    this.versionStream.write({ version: 1 });
  }

  private async disable() {
    log.debug('Desktop disabled');

    if (this.canTransferState()) {
      const stateToTransfer = await RawState.getAndUpdateDesktopState({
        desktopEnabled: false,
        isPairing: false,
      });

      await RawState.clear();

      this.disableStream.write(stateToTransfer);

      await waitForMessage(this.disableStream);

      log.debug(
        'Sent state to extension and reset extension state initialization flag',
      );
    }

    this.hasBeenInitializedWithExtensionState = false;

    this.emit('disable');
  }

  private transferState(rawState: any) {
    if (!this.canTransferState()) {
      log.debug(
        'Cannot transfer state to extension as waiting for initial state from extension',
      );
      return;
    }

    this.stateStream.write(rawState);

    log.debug('Sent state to extension');
  }

  private canTransferState() {
    return this.hasBeenInitializedWithExtensionState;
  }
}
