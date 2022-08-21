module.exports = {
    error: (message, data) => window.electron.log('error', message, data),
    warn: (message, data) => window.electron.log('warn', message, data),
    info: (message, data) => window.electron.log('info', message, data),
    verbose: (message, data) => window.electron.log('verbose', message, data),
    debug: (message, data) => window.electron.log('debug', message, data),
    silly: (message, data) => window.electron.log('silly', message, data)
};
