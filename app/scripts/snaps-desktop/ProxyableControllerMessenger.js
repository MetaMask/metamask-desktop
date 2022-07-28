"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyableControllerMessenger = void 0;
const controllers_1 = require("@metamask/controllers");
const nanoid_1 = __importDefault(require("nanoid"));
const utils_1 = require("./utils");
class ProxyableControllerMessenger extends controllers_1.ControllerMessenger {
    constructor(proxyHandler, proxyableActions) {
        super();
        this.proxyHandler = proxyHandler;
        this.proxyableActions = proxyableActions;
    }
    call(actionType, ...params) {
        if (this.proxyableActions.includes(actionType)) {
            // @ts-expect-error Result type should be a promise
            return this.proxiedCall(actionType, ...params);
        }
        return super.call(actionType, ...params);
    }
    async proxiedCall(actionType, ...p) {
        // Guaranteed to be defined in proxyableActions
        const id = (0, nanoid_1.default)();
        // @ts-expect-error Result type should be a promise
        return this.proxyHandler((0, utils_1.getJsonRpcRequest)(id, 'ControllerMessenger:proxyCall', [
            actionType,
            p,
        ]));
    }
    publish(eventType, ...payload) {
        // Always publish events across proxy for now
        this.handleProxyPublish(eventType, ...payload);
        super.publish(eventType, ...payload);
    }
    handleProxyPublish(eventType, ...payload) {
        const id = (0, nanoid_1.default)();
        this.proxyHandler((0, utils_1.getJsonRpcRequest)(id, 'ControllerMessenger:proxyEvent', [
            eventType,
            payload,
        ]));
    }
    // Handles proxy event from other client
    handleProxyEvent(request) {
        const [eventType, payload] = request.params;
        // TODO: Validate and type
        super.publish(eventType, ...payload);
    }
    // Handles proxy call from other client
    handleProxyCall(request) {
        const [actionType, payload] = request.params;
        // TODO: Validate and type
        return super.call(actionType, ...payload);
    }
}
exports.ProxyableControllerMessenger = ProxyableControllerMessenger;
//# sourceMappingURL=ProxyableControllerMessenger.js.map