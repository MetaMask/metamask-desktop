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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyableControllerMessenger = void 0;
const controllers_1 = require("@metamask/controllers");
const nanoid_1 = __importDefault(require("nanoid"));
const json_1 = require("./json");
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
    proxiedCall(actionType, ...p) {
        return __awaiter(this, void 0, void 0, function* () {
            // Guaranteed to be defined in proxyableActions
            const id = (0, nanoid_1.default)();
            // @ts-expect-error Result type should be a promise
            return this.proxyHandler((0, json_1.getJsonRpcRequest)(id, 'ControllerMessenger:proxyCall', [actionType, p]));
        });
    }
    publish(eventType, ...payload) {
        // Always publish events across proxy for now
        this.handleProxyPublish(eventType, ...payload);
        super.publish(eventType, ...payload);
    }
    handleProxyPublish(eventType, ...payload) {
        const id = (0, nanoid_1.default)();
        this.proxyHandler((0, json_1.getJsonRpcRequest)(id, 'ControllerMessenger:proxyEvent', [
            eventType,
            payload,
        ]));
    }
    // Handles proxy event from other client
    handleProxyEvent(request) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const [eventType, payload] = request.params;
        // TODO: Validate and type
        super.publish(eventType, ...payload);
    }
    // Handles proxy call from other client
    handleProxyCall(request) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const [actionType, payload] = request.params;
        // TODO: Validate and type
        return super.call(actionType, ...payload);
    }
}
exports.ProxyableControllerMessenger = ProxyableControllerMessenger;
//# sourceMappingURL=ProxyableControllerMessenger.js.map