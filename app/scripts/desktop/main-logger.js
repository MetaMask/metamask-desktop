const log = require('electron-log');
const { ipcMain } = require('electron');

let init = false;

if(!init) {
    log.transports.file.level = false;
    log.transports.console.level = process.env.DESKTOP_LOG_LEVEL?.toLowerCase();

    ipcMain.handle('log', (event, data) => {
        log.scope('renderer')[data.level].apply(null, [data.message, ...(data.data ? [data.data] : [])]);
    });

    init = true;
}

const mainLog = log.scope('main');

module.exports = mainLog;
