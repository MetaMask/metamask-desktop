/* eslint-disable import/unambiguous */
// catch rejections that are still unhandled when tests exit
const unhandledRejections = new Map();
process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled rejection:', reason);
  unhandledRejections.set(promise, reason);
});

process.on('rejectionHandled', (promise) => {
  console.log(`handled: ${unhandledRejections.get(promise)}`);
  unhandledRejections.delete(promise);
});

process.on('exit', () => {
  if (unhandledRejections.size > 0) {
    console.error(`Found ${unhandledRejections.size} unhandled rejections:`);
    for (const reason of unhandledRejections.values()) {
      console.error('Unhandled rejection: ', reason);
    }
    process.exit(1);
  }
});

// Jest no longer adds the following timers so we use set/clear Timeouts
global.setImmediate =
  global.setImmediate ||
  ((fn: (...args: any[]) => void, ...args: any) =>
    global.setTimeout(fn, 0, ...args));

global.clearImmediate =
  global.clearImmediate || ((id) => global.clearTimeout(id));
