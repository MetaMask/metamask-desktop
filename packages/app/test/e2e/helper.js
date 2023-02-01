/* eslint-disable node/no-sync */
/* eslint-disable node/no-process-env */

const cp = require('child_process');
const { promises: fs } = require('fs');

const APP_START_TIMEOUT = 30000;
const BEFORE_NAVIGATE_DELAY = 3000;

const sleep = async (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

const getProcesses = () => {
  return cp
    .spawnSync('ps axo pid,command', { shell: true, encoding: 'utf-8' })
    .stdout.split('\n')
    .map((rawData) => {
      const data = rawData.trim().split(' ');
      return { pid: data[0], command: data.slice(1).join(' ') };
    })
    .filter((currentProcess) => currentProcess.command);
};

const getProcessesByCommand = (filters, options = { matchAll: false }) => {
  return getProcesses().filter((proc) =>
    (options.matchAll ? filters.every : filters.some).bind(filters)((filter) =>
      proc.command.toLowerCase().includes(filter.toLowerCase()),
    ),
  );
};

const killProcesses = (processIds) => {
  cp.spawnSync(`kill -9 ${processIds.join(' ')}`, {
    shell: true,
  });
};

const killProcessesByCommand = (filters) => {
  killProcesses(getProcessesByCommand(filters).map((proc) => proc.pid));
};

const waitForEvent = async (emitter, eventName, timeout, validator) => {
  return new Promise((resolve, reject) => {
    const timeoutInstance = setTimeout(reject, timeout);

    emitter.on(eventName, (eventData) => {
      if (validator(eventData)) {
        clearTimeout(timeoutInstance);
        resolve();
      }
    });
  });
};

const isInCI = () => {
  return process.env.CI === 'true';
};

const onDesktopAppLog = (messageBuffer) => {
  const message = Buffer.from(messageBuffer, 'utf8').toString('utf8');
  console.log(`Desktop App: ${message.trim()}`);
};

const startDesktopApp = async () => {
  console.log('Starting desktop app');

  const command = `${isInCI() ? 'xvfb-run -a ' : ''}sh test/e2e/start-app.sh`;

  const desktopApp = cp.spawn(command, {
    shell: true,
    cwd: `${process.cwd()}/../../`,
  });

  desktopApp.stdout.on('data', onDesktopAppLog);
  desktopApp.stderr.on('data', onDesktopAppLog);

  await waitForEvent(desktopApp.stdout, 'data', APP_START_TIMEOUT, (data) =>
    data.includes('MetaMask initialization complete.'),
  ).catch(() => {
    throw new Error('Timeout waiting for desktop app to start');
  });

  console.log('Started desktop app successfully');
};

const stopDesktopApp = () => {
  console.info('Stopping desktop app');
  killProcessesByCommand(['lavamoat.js', 'start:test']);
};

const setDesktopAppState = async (state) => {
  const desktopStatePath = isInCI()
    ? process.env.UBUNTU_ELECTRON_CONFIG_FILE_PATH
    : process.env.LOCAL_ELECTRON_CONFIG_FILE_PATH;

  console.log('Updating desktop app state', { file: desktopStatePath });

  await fs.mkdir(desktopStatePath.replace('config.json', ''), {
    recursive: true,
  });

  await fs.writeFile(desktopStatePath, JSON.stringify(state, null, 2));
};

const addDesktopState = (state) => {
  state.data.DesktopController = { desktopEnabled: true };
  return state;
};

const beforeDesktopNavigate = async (_driver) => {
  await sleep(BEFORE_NAVIGATE_DELAY);
};

const getElectronWindowCount = () => {
  return getProcessesByCommand(['electron', 'dist/app', '--type=renderer'], {
    matchAll: true,
  }).length;
};

module.exports = {
  startDesktopApp,
  stopDesktopApp,
  setDesktopAppState,
  addDesktopState,
  beforeDesktopNavigate,
  getElectronWindowCount,
};
