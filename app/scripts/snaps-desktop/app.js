"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleInterceptFileProtocol = exports.bootstrap = void 0;
const path_1 = require("path");
const electron_1 = require("electron");
/**
 * Create a tray menu for the Electron app.
 */
const createTray = () => {
    const tray = new electron_1.Tray((0, path_1.join)(__dirname, './assets/icon-16x.png'));
    tray.setToolTip('MetaMask Snaps');
    const trayMenu = electron_1.Menu.buildFromTemplate([
        {
            label: 'Quit',
            role: 'quit',
            click: () => electron_1.app.quit(),
        },
    ]);
    tray.on('click', () => {
        tray.popUpContextMenu(trayMenu);
    });
    tray.on('right-click', () => {
        tray.popUpContextMenu(trayMenu);
    });
};
/**
 * Bootstrap the application.
 */
const bootstrap = () => {
    createTray();
};
exports.bootstrap = bootstrap;
/**
 * Handles a file protocol request. It checks if the requested file is from the
 * app directory and if so, returns the file. Otherwise, it returns an access
 * denied error.
 *
 * @param request - The protocol request.
 * @param callback - The callback to call with the response.
 * @returns Nothing.
 */
const handleInterceptFileProtocol = (request, callback) => {
    const appPath = (0, path_1.resolve)(__dirname, '../');
    // Remove an extra slash on Windows
    const filePath = (0, path_1.normalize)(request.url.slice(process.platform === 'win32' ? 8 : 7));
    if (filePath.startsWith(appPath)) {
        return callback({ path: filePath });
    }
    // If the file is not from the app, reply with access denied.
    return callback({ error: -10 });
};
exports.handleInterceptFileProtocol = handleInterceptFileProtocol;
//# sourceMappingURL=app.js.map