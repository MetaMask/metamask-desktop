//
// build task definitions
//
// run any task with "yarn build ${taskName}"
//
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const {
  BuildType,
} = require('../../submodules/extension/development/lib/build-type');
const {
  getConfig,
} = require('../../submodules/extension/development/build/config');
const { TASKS } = require('./constants');
const {
  createTask,
  composeSeries,
  composeParallel,
  runTask,
} = require('./task');
const createStaticAssetTasks = require('./static');
const createStyleTasks = require('./styles');
const createScriptTasks = require('./scripts');
const createEtcTasks = require('./etc');

// Packages required dynamically via browserify configuration in dependencies
// Required for LavaMoat policy generation
require('loose-envify');
require('globalthis');
require('@babel/preset-env');
require('@babel/preset-react');
require('@babel/preset-typescript');
require('@babel/core');
// ESLint-related
require('@babel/eslint-parser');
require('@babel/eslint-plugin');
require('@metamask/eslint-config');
require('@metamask/eslint-config-nodejs');
require('@typescript-eslint/parser');
require('eslint');
require('eslint-config-prettier');
require('eslint-import-resolver-node');
require('eslint-import-resolver-typescript');
require('eslint-plugin-import');
require('eslint-plugin-jsdoc');
require('eslint-plugin-node');
require('eslint-plugin-prettier');
require('eslint-plugin-react');
require('eslint-plugin-react-hooks');
require('eslint-plugin-jest');

buildDesktopUi().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});

/**
 * Entry point for desktop UI bundle generation.
 */
async function buildDesktopUi() {
  const {
    applyLavaMoat,
    buildType,
    entryTask,
    isLavaMoat,
    policyOnly,
    shouldIncludeLockdown,
    shouldLintFenceFiles,
    skipStats,
  } = await parseArgv();

  const staticTasks = createStaticAssetTasks({
    shouldIncludeLockdown,
    buildType,
  });

  const styleTasks = createStyleTasks();

  const scriptTasks = createScriptTasks({
    applyLavaMoat,
    buildType,
    isLavaMoat,
    policyOnly,
    shouldLintFenceFiles,
  });

  const { clean } = createEtcTasks();

  // build for development
  createTask(
    TASKS.DEV,
    composeSeries(
      clean,
      styleTasks.dev,
      composeParallel(scriptTasks.dev, staticTasks.dev),
    ),
  );

  // build production-like distributable build
  createTask(
    TASKS.DIST,
    composeSeries(
      clean,
      styleTasks.prod,
      composeParallel(scriptTasks.dist, staticTasks.prod),
    ),
  );

  // build for prod release
  createTask(
    TASKS.PROD,
    composeSeries(
      clean,
      styleTasks.prod,
      composeParallel(scriptTasks.prod, staticTasks.prod),
    ),
  );

  // build just production scripts, for LavaMoat policy generation purposes
  createTask(TASKS.SCRIPTS_DIST, scriptTasks.dist);

  // special build for minimal CI testing
  createTask(TASKS.styles, styleTasks.prod);

  // Finally, start the build process by running the entry task.
  await runTask(entryTask, { skipStats });
}

/**
 * Parse args for bundle generation.
 */
async function parseArgv() {
  const { argv } = yargs(hideBin(process.argv))
    .usage('$0 <task> [options]', 'Build the MetaMask extension.', (_yargs) =>
      _yargs
        .positional('task', {
          description: `The task to run. There are a number of main tasks, each of which calls other tasks internally. The main tasks are:

dev: Create an unoptimized for local development.

dist: Create an optimized production-like for a non-production environment.

prod: Create an optimized build for a production environment.`,
          type: 'string',
        })
        .option('apply-lavamoat', {
          default: true,
          description:
            'Whether to use LavaMoat. Setting this to `false` can be useful during development if you want to handle LavaMoat errors later.',
          type: 'boolean',
        })
        .option('lockdown', {
          default: true,
          description:
            'Whether to include SES lockdown files in the desktop ui bundle. Setting this to `false` can be useful during development if you want to handle lockdown errors later.',
          type: 'boolean',
        })
        .option('policy-only', {
          default: false,
          description:
            'Stop the build after generating the LavaMoat policy, skipping any writes to disk other than the LavaMoat policy itself.',
          type: 'boolean',
        })
        .option('skip-stats', {
          default: false,
          description:
            'Whether to skip logging the time to completion for each task to the console. This is meant primarily for internal use, to prevent duplicate logging.',
          hidden: true,
          type: 'boolean',
        })
        .check((args) => {
          if (!Object.values(TASKS).includes(args.task)) {
            throw new Error(`Invalid task: '${args.task}'`);
          }
          return true;
        }),
    )
    // TODO: Enable `.strict()` after this issue is resolved: https://github.com/LavaMoat/LavaMoat/issues/344
    .help('help');

  const {
    applyLavamoat: applyLavaMoat,
    lintFenceFiles,
    lockdown,
    policyOnly,
    skipStats,
    task,
  } = argv;

  const buildType = BuildType.desktopui;

  // Manually default this to `false` for dev builds only.
  const shouldLintFenceFiles = lintFenceFiles ?? !/dev/iu.test(task);

  // TODO - review how do we want to load config for both desktop App and desktop UI
  // Output ignored, this is only called to ensure config is validated
  await getConfig();

  return {
    applyLavaMoat,
    buildType,
    entryTask: task,
    isLavaMoat: process.argv[0].includes('lavamoat'),
    policyOnly,
    shouldIncludeLockdown: lockdown,
    shouldLintFenceFiles,
    skipStats,
  };
}
