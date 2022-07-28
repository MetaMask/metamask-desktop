"use strict";
/* eslint-disable consistent-return */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWebSocketServer = void 0;
const ws_1 = require("ws");
const constants_1 = require("./constants");
const client_1 = require("./client");
/**
 * Create a new WebSocket server to handle (encrypted) JSON-RPC requests.
 *
 * @param handlers - Handlers to run for specific RPC methods.
 * @returns An instance of the WebSocket server and the underlying client.
 */
const createWebSocketServer = (handlers) => {
    const server = new ws_1.WebSocketServer({
        host: 'localhost',
        port: constants_1.SERVER_PORT,
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