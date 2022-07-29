"use strict";
/* eslint-disable consistent-return */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWebSocketServer = void 0;
const ws_1 = require("ws");
const client_1 = require("./client");
/**
 * Create a new WebSocket server to handle (encrypted) JSON-RPC requests.
 *
 * @param options - The server options.
 * @param options.host - The host to bind the server to.
 * @param options.port - The port to bind the server to.
 * @param options.handlers - The handlers to run for specific RPC methods.
 * @returns An instance of the WebSocket server and the underlying client.
 */
const createWebSocketServer = ({ host = 'localhost', port = 8000, handlers, }) => {
    const server = new ws_1.WebSocketServer({
        host,
        port,
    });
    let client = null;
    server.on('connection', (socket) => {
        // TODO: Figure out what to do with multiple connections
        client = (0, client_1.createWebSocketClient)(socket, handlers);
    });
    return { server, getClient: () => client };
};
exports.createWebSocketServer = createWebSocketServer;
//# sourceMappingURL=server.js.map