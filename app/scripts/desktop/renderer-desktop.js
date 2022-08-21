const endOfStream = require('end-of-stream');
const ObjectMultiplex = require('obj-multiplex');
const MainProcessStream = require('./streams/main-process-stream');
const log = require('./renderer-logger');

const CLIENT_ID_BROWSER_CONTROLLER = 'browserController';
const CLIENT_ID_CONNECTION_CONTROLLER = 'connectionController';
const CLIENT_ID_HANDSHAKES = 'handshakes';
const CLIENT_ID_STATUS = 'status';
const BROWSER_ACTION_SHOW_POPUP = 'showPopup';

class Desktop {
  constructor() {
    this._connections = [];
    this._multiplex = new ObjectMultiplex();
    this._clientStreams = {};
  }

  async init(connectRemote) {
    this._connectRemote = connectRemote;

    this._browserControllerStream = this._multiplex.createStream(CLIENT_ID_BROWSER_CONTROLLER);

    const connectionControllerStream = this._multiplex.createStream(CLIENT_ID_CONNECTION_CONTROLLER);
    connectionControllerStream.on('data', (data) => this._onConnectionControllerMessage(data));

    const handshakeStream = this._multiplex.createStream(CLIENT_ID_HANDSHAKES);
    handshakeStream.on('data', (data) => this._onHandshake(data));

    this._statusStream = this._multiplex.createStream(CLIENT_ID_STATUS);

    const mainProcessStream = new MainProcessStream('desktop');
    mainProcessStream.pipe(this._multiplex).pipe(mainProcessStream);

    log.verbose('Initialised desktop in renderer process');
  }

  showPopup() {
    this._browserControllerStream.write(BROWSER_ACTION_SHOW_POPUP);
  }

  _onHandshake(data) {
    log.verbose('Received handshake', { 
      clientId: data.clientId,
      name: data.remotePort.name,
      url: data.remotePort.sender.url
    });

    const clientId = data.clientId;

    const stream = this._multiplex.createStream(clientId);
    this._clientStreams[clientId] = stream;

    endOfStream(stream, () => this._onClientStreamEnd(clientId));

    this._connectRemote({
        ...data.remotePort,
        stream,
        onMessage: {
          addListener: () => {}
        }
    });

    this._connections.push(data);
    this._updateStatusWindow();
  }

  _onClientStreamEnd(clientId) {
    log.verbose('Client stream ended', clientId);

    const index = this._connections.find(connection => connection.clientId === clientId);
    this._connections.splice(index, 1);

    delete this._clientStreams[clientId];
    delete this._multiplex._substreams[clientId];
    
    this._updateStatusWindow();
  }

  _onConnectionControllerMessage(data) {
    log.verbose('Received connection controller message', data);

    const clientStreams = data.clientId ?
      [this._clientStreams[data.clientId]] :
      Object.values(this._clientStreams);
    
    clientStreams.forEach(stream => stream.end());  
  }

  _updateStatusWindow() {
    this._statusStream.write({
      connections: this._connections
    });
  }
}

module.exports = Desktop;