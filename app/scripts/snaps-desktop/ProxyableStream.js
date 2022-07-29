"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyableStream = void 0;
const stream_1 = require("stream");
const json_1 = require("./json");
// TODO: Clean up this code.
class ProxyableStream {
    constructor(proxyHandler) {
        this.proxyHandler = proxyHandler;
        this.streams = {};
    }
    registerExtension(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const passThrough = new stream_1.Transform({
                objectMode: true,
                transform: (chunk, _encoding, callback) => {
                    // Data with this flag comes from another process
                    if ('_proxy' in chunk) {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const { _proxy, chunk: c } = chunk;
                        callback(null, c);
                        return;
                    }
                    this.proxyHandler((0, json_1.getJsonRpcRequest)(null, 'ProxyableStream:write', [id, chunk]))
                        .then(() => callback())
                        .catch((err) => callback(err));
                },
            });
            // TODO: Handle existing stream?
            this.streams[id] = passThrough;
            passThrough.on('close', () => this.handleClose(id).catch((err) => console.error(err)));
            yield this.handleOpen(id);
            return passThrough;
        });
    }
    registerDesktop(id, stream) {
        return __awaiter(this, void 0, void 0, function* () {
            const incomingPassThrough = new stream_1.Transform({
                objectMode: true,
                transform: (chunk, _encoding, callback) => {
                    // Data with this flag comes from another process
                    if ('_proxy' in chunk) {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const { _proxy, chunk: c } = chunk;
                        callback(null, c);
                    }
                },
            });
            const outgoingPassThrough = new stream_1.Transform({
                objectMode: true,
                transform: (chunk, _encoding, callback) => {
                    this.proxyHandler((0, json_1.getJsonRpcRequest)(null, 'ProxyableStream:write', [id, chunk]))
                        .then(() => callback(null, chunk))
                        .catch((error) => callback(error));
                },
            });
            // TODO: Handle existing stream?
            this.streams[id] = incomingPassThrough;
            stream.on('close', () => this.handleClose(id).catch((err) => console.error(err)));
            yield this.handleOpen(id);
            stream.pipe(outgoingPassThrough);
            incomingPassThrough.pipe(stream);
        });
    }
    handleOpen(id) {
        return this.proxyHandler((0, json_1.getJsonRpcRequest)(null, 'ProxyableStream:open', [id]));
    }
    handleClose(id) {
        return this.proxyHandler((0, json_1.getJsonRpcRequest)(null, 'ProxyableStream:close', [id]));
    }
    handleData(request) {
        const [id, chunk] = request.params;
        // Add flag for data that comes from other process
        this.streams[id].write({ _proxy: true, chunk });
    }
}
exports.ProxyableStream = ProxyableStream;
//# sourceMappingURL=ProxyableStream.js.map