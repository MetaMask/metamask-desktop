import { ActionConstraint, ControllerMessenger, EventConstraint } from '@metamask/controllers';
import { JsonRpcRequest } from '@metamask/utils';
declare type ExtractActionParameters<Action, T> = Action extends {
    type: T;
    handler: (...args: infer H) => any;
} ? H : never;
declare type ExtractActionResponse<Action, T> = Action extends {
    type: T;
    handler: (...args: any) => infer H;
} ? H : never;
declare type ExtractEventPayload<Event, T> = Event extends {
    type: T;
    payload: infer P;
} ? P : never;
export declare class ProxyableControllerMessenger<Action extends ActionConstraint, Event extends EventConstraint> extends ControllerMessenger<Action, Event> {
    private proxyHandler;
    private proxyableActions;
    constructor(proxyHandler: (request: JsonRpcRequest<unknown>) => Promise<unknown>, proxyableActions: Action['type'][]);
    call<T extends Action['type']>(actionType: T, ...params: ExtractActionParameters<Action, T>): ExtractActionResponse<Action, T>;
    private proxiedCall;
    publish<E extends Event['type']>(eventType: E, ...payload: ExtractEventPayload<Event, E>): void;
    private handleProxyPublish;
    handleProxyEvent(request: JsonRpcRequest<[Event['type'], unknown[]]>): void;
    handleProxyCall(request: JsonRpcRequest<[Action['type'], unknown[]]>): Action extends {
        type: Action["type"];
        handler: (...args: any) => infer H;
    } ? H : never;
}
export {};
