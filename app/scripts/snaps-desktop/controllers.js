"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const snap_controllers_1 = require("@metamask/snap-controllers");
const semver_1 = require("semver");
const server_1 = require("./server");
const ProxyableControllerMessenger_1 = require("./ProxyableControllerMessenger");
const initState = { SnapController: undefined }; // TODO: LOAD
const proxyableActions = [
    `PermissionController:getEndowments`,
    `PermissionController:getPermissions`,
    `PermissionController:hasPermission`,
    `PermissionController:hasPermissions`,
    `PermissionController:requestPermissions`,
    `PermissionController:revokeAllPermissions`,
    `PermissionController:revokePermissionForAllSubjects`,
    'MetaMaskController:closeAllConnections',
    'MetaMaskController:getAppKey',
];
// TODO: Proxy requests to ControllerMessenger that are meant for controllers present in the extension
const controllerMessenger = new ProxyableControllerMessenger_1.ProxyableControllerMessenger(async (request) => {
    const client = getClient();
    if (!client) {
        throw new Error('No client available!');
    }
    return client.requestEncrypted(request);
}, proxyableActions);
const { getClient } = (0, server_1.createWebSocketServer)({
    // @ts-expect-error TODO: Fix types
    'ControllerMessenger:proxyCall': controllerMessenger.handleProxyCall.bind(controllerMessenger),
    // @ts-expect-error TODO: Fix types
    'ControllerMessenger:proxyEvent': controllerMessenger.handleProxyEvent.bind(controllerMessenger),
});
const snapControllerMessenger = controllerMessenger.getRestricted({
    name: 'SnapController',
    allowedEvents: [
        'ExecutionService:unhandledError',
        'ExecutionService:outboundRequest',
        'ExecutionService:outboundResponse',
    ],
    allowedActions: [
        `PermissionController:getEndowments`,
        `PermissionController:getPermissions`,
        `PermissionController:hasPermission`,
        `PermissionController:hasPermissions`,
        `PermissionController:requestPermissions`,
        `PermissionController:revokeAllPermissions`,
        `PermissionController:revokePermissionForAllSubjects`,
        'ExecutionService:executeSnap',
        'ExecutionService:getRpcRequestHandler',
        'ExecutionService:terminateSnap',
        'ExecutionService:terminateAllSnaps',
    ],
});
const SNAP_BLOCKLIST = [
    {
        id: 'npm:@consensys/starknet-snap',
        versionRange: '<0.1.11',
        reason: undefined,
        infoUrl: undefined,
    },
];
const closeAllConnections = (origin) => {
    // TODO: Proxy?
    // TODO: Register in MetaMaskController somehow
    return controllerMessenger.call('MetaMaskController:closeAllConnections', origin);
};
const getAppKey = async (subject, appKeyType) => {
    // TODO: Proxy
    // Prefix subject with appKeyType to generate separate keys for separate uses
    return controllerMessenger.call('MetaMaskController:getAppKey', subject, appKeyType);
};
const snapController = new snap_controllers_1.SnapController({
    environmentEndowmentPermissions: [
        'endowment:network-access',
        'endowment:long-running',
    ],
    closeAllConnections,
    getAppKey,
    checkBlockList: async (snapsToCheck) => {
        return Object.entries(snapsToCheck).reduce((acc, [snapId, snapVersion]) => {
            const blockInfo = SNAP_BLOCKLIST.find((blocked) => blocked.id === snapId &&
                (0, semver_1.satisfies)(snapVersion, blocked.versionRange, {
                    includePrerelease: true,
                }));
            const cur = blockInfo
                ? {
                    blocked: true,
                    reason: blockInfo.reason,
                    infoUrl: blockInfo.infoUrl,
                }
                : { blocked: false };
            return Object.assign(Object.assign({}, acc), { [snapId]: cur });
        }, {});
    },
    state: initState.SnapController,
    messenger: snapControllerMessenger,
    featureFlags: {},
});
const setupSnapProvider = (_snapId, _stream) => {
    // TODO: proxy stream towards extension
};
const executionEnvironment = new snap_controllers_1.NodeThreadExecutionService({
    messenger: controllerMessenger.getRestricted({
        name: 'ExecutionService',
    }),
    setupSnapProvider,
});
//# sourceMappingURL=controllers.js.map