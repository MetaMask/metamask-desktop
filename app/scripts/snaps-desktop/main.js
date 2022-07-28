"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const app_1 = require("./app");
require("./controllers");
// This must be called before the app is ready.
electron_1.app.enableSandbox();
electron_1.app.on('ready', () => {
    (0, app_1.bootstrap)();
    electron_1.protocol.interceptFileProtocol('file', app_1.handleInterceptFileProtocol);
});
//# sourceMappingURL=main.js.map