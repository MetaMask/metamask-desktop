/// <reference types="node" />
import { Duplex, PassThrough } from 'stream';
import { JsonRpcRequest } from '@metamask/utils';
export declare class ProxyableStream {
    private proxyHandler;
    private streams;
    constructor(proxyHandler: (request: JsonRpcRequest<unknown>) => Promise<unknown>);
    registerExtension(id: string): Promise<PassThrough>;
    registerDesktop(id: string, stream: Duplex): Promise<void>;
    private handleOpen;
    private handleClose;
    handleData(request: JsonRpcRequest<unknown>): void;
}
