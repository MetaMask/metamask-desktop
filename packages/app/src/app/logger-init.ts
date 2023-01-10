import electronLog from 'electron-log';
import type { functions as electronLogFunctions } from 'electron-log';
import loglevel from 'loglevel';

declare global {
  const electronLog: typeof electronLogFunctions;
}

declare const global: {
  logsInitialised: boolean;
};

if (!global.logsInitialised) {
  // Modify file format logs to include processType
  electronLog.transports.file.format =
    '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] [{processType}] {text}';

  // Creates a loglevel plugin that overrides loglevel log methods
  const originalMethodFactory = loglevel.methodFactory;
  loglevel.methodFactory = function (methodName, logLevel, loggerName) {
    const methodOverrides = new Map([
      ['error', electronLog.error],
      ['warn', electronLog.warn],
      ['info', electronLog.info],
      ['debug', electronLog.debug],
      ['trace', electronLog.silly],
    ]);

    // All documented log methods have been added
    // Using the default as a fallback in case new methods are added to loglevel
    const logMethod =
      methodOverrides.get(methodName) ||
      originalMethodFactory(methodName, logLevel, loggerName);

    return logMethod;
  };

  // This forces loglevel to replace the methods
  loglevel.setLevel(loglevel.getLevel());

  // Override console logging functions
  Object.assign(console, electronLog.functions);

  // Injects an electronLog global in every renderer process
  electronLog.initialize({ preload: true });

  // Set boolean to prevent reinitialising
  global.logsInitialised = true;
}

export {};
