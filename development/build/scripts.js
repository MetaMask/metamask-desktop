const { callbackify } = require('util');
const path = require('path');
const { writeFileSync, readFileSync } = require('fs');
const EventEmitter = require('events');
const gulp = require('gulp');
const watch = require('gulp-watch');
const Vinyl = require('vinyl');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const log = require('fancy-log');
const browserify = require('browserify');
const watchify = require('watchify');
const babelify = require('babelify');
const brfs = require('brfs');
const envify = require('loose-envify/custom');
const sourcemaps = require('gulp-sourcemaps');
const applySourceMap = require('vinyl-sourcemaps-apply');
const pify = require('pify');
const through = require('through2');
const endOfStream = pify(require('end-of-stream'));
const labeledStreamSplicer = require('labeled-stream-splicer').obj;
const wrapInStream = require('pumpify').obj;
const Sqrl = require('squirrelly');
const lavapack = require('@lavamoat/lavapack');
const lavamoatBrowserify = require('lavamoat-browserify');
const terser = require('terser');

const bifyModuleGroups = require('bify-module-groups');

const metamaskrc = require('rc')('metamask', {
  INFURA_PROJECT_ID: process.env.INFURA_PROJECT_ID,
  INFURA_BETA_PROJECT_ID: process.env.INFURA_BETA_PROJECT_ID,
  INFURA_FLASK_PROJECT_ID: process.env.INFURA_FLASK_PROJECT_ID,
  INFURA_PROD_PROJECT_ID: process.env.INFURA_PROD_PROJECT_ID,
  ONBOARDING_V2: process.env.ONBOARDING_V2,
  COLLECTIBLES_V1: process.env.COLLECTIBLES_V1,
  TOKEN_DETECTION_V2: process.env.TOKEN_DETECTION_V2,
  SEGMENT_HOST: process.env.SEGMENT_HOST,
  SEGMENT_WRITE_KEY: process.env.SEGMENT_WRITE_KEY,
  SEGMENT_BETA_WRITE_KEY: process.env.SEGMENT_BETA_WRITE_KEY,
  SEGMENT_FLASK_WRITE_KEY: process.env.SEGMENT_FLASK_WRITE_KEY,
  SEGMENT_PROD_WRITE_KEY: process.env.SEGMENT_PROD_WRITE_KEY,
  SENTRY_DSN_DEV:
    process.env.SENTRY_DSN_DEV ||
    'https://f59f3dd640d2429d9d0e2445a87ea8e1@sentry.io/273496',
});

const { streamFlatMap } = require('../stream-flat-map.js');
const { BuildType } = require('../lib/build-type');

const {
  createTask,
  composeParallel,
  composeSeries,
  runInChildProcess,
} = require('./task');
const {
  createRemoveFencedCodeTransform,
} = require('./transforms/remove-fenced-code');
const lavamoatDesktopStream = require('../lavamoat-desktop-stream.js');

/**
 * The build environment. This describes the environment this build was produced in.
 */
const ENVIRONMENT = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  OTHER: 'other',
  PULL_REQUEST: 'pull-request',
  RELEASE_CANDIDATE: 'release-candidate',
  STAGING: 'staging',
  TESTING: 'testing',
};

/**
 * Get a value from the configuration, and confirm that it is set.
 *
 * @param {string} key - The configuration key to retrieve.
 * @returns {string} The config entry requested.
 * @throws {Error} Throws if the requested key is missing.
 */
function getConfigValue(key) {
  const value = metamaskrc[key];
  if (!value) {
    throw new Error(`Missing config entry for '${key}'`);
  }
  return value;
}

/**
 * Get the appropriate Infura project ID.
 *
 * @param {object} options - The Infura project ID options.
 * @param {BuildType} options.buildType - The current build type.
 * @param {ENVIRONMENT[keyof ENVIRONMENT]} options.environment - The build environment.
 * @param {boolean} options.testing - Whether the current build is a test build or not.
 * @returns {string} The Infura project ID.
 */
function getInfuraProjectId({ buildType, environment, testing }) {
  if (testing) {
    return '00000000000000000000000000000000';
  } else if (environment !== ENVIRONMENT.PRODUCTION) {
    // Skip validation because this is unset on PRs from forks.
    return metamaskrc.INFURA_PROJECT_ID;
  } else if (buildType === BuildType.main) {
    return getConfigValue('INFURA_PROD_PROJECT_ID');
  } else if (buildType === BuildType.beta) {
    return getConfigValue('INFURA_BETA_PROJECT_ID');
  } else if (buildType === BuildType.flask) {
    return getConfigValue('INFURA_FLASK_PROJECT_ID');
  }
  throw new Error(`Invalid build type: '${buildType}'`);
}

/**
 * Get the appropriate Segment write key.
 *
 * @param {object} options - The Segment write key options.
 * @param {BuildType} options.buildType - The current build type.
 * @param {keyof ENVIRONMENT} options.environment - The current build environment.
 * @returns {string} The Segment write key.
 */
function getSegmentWriteKey({ buildType, environment }) {
  if (environment !== ENVIRONMENT.PRODUCTION) {
    // Skip validation because this is unset on PRs from forks, and isn't necessary for development builds.
    return metamaskrc.SEGMENT_WRITE_KEY;
  } else if (buildType === BuildType.main) {
    return getConfigValue('SEGMENT_PROD_WRITE_KEY');
  } else if (buildType === BuildType.beta) {
    return getConfigValue('SEGMENT_BETA_WRITE_KEY');
  } else if (buildType === BuildType.flask) {
    return getConfigValue('SEGMENT_FLASK_WRITE_KEY');
  }
  throw new Error(`Invalid build type: '${buildType}'`);
}

const noopWriteStream = through.obj((_file, _fileEncoding, callback) =>
  callback(),
);

module.exports = createScriptTasks;

function createScriptTasks({
  applyLavaMoat,
  browserPlatforms,
  buildType,
  ignoredFiles,
  isLavaMoat,
  livereload,
  shouldLintFenceFiles,
  policyOnly,
  version,
  buildPlatform,
}) {
  // internal tasks
  const core = {
    // dev tasks (live reload)
    dev: createTasksForBuildJsExtension({
      taskPrefix: 'scripts:core:dev',
      devMode: true,
    }),
    testDev: createTasksForBuildJsExtension({
      taskPrefix: 'scripts:core:test-live',
      devMode: true,
      testing: true,
    }),
    // built for CI tests
    test: createTasksForBuildJsExtension({
      taskPrefix: 'scripts:core:test',
      testing: true,
    }),
    // production
    prod: createTasksForBuildJsExtension({ taskPrefix: 'scripts:core:prod' }),
  };

  // high level tasks

  const { dev, test, testDev, prod } = core;
  return { dev, test, testDev, prod };

  function createTasksForBuildJsExtension({ taskPrefix, devMode, testing }) {
    if (buildPlatform === 'desktop') {
      return createTask(
        `${taskPrefix}:desktop`,
        createFactoredBuild({
          applyLavaMoat,
          browserPlatforms: ['desktop'],
          buildType,
          devMode,
          entryFiles: [`./app/scripts/desktop.js`],
          ignoredFiles,
          policyOnly,
          shouldLintFenceFiles,
          testing,
          version,
          buildPlatform,
        }),
      );
    }

    const standardEntryPoints = ['background', 'ui', 'content-script'];
    const standardSubtask = createTask(
      `${taskPrefix}:standardEntryPoints`,
      createFactoredBuild({
        applyLavaMoat,
        browserPlatforms,
        buildType,
        devMode,
        entryFiles: standardEntryPoints.map((label) => {
          if (label === 'content-script') {
            return './app/vendor/trezor/content-script.js';
          }
          return `./app/scripts/${label}.js`;
        }),
        ignoredFiles,
        policyOnly,
        shouldLintFenceFiles,
        testing,
        version,
      }),
    );

    // inpage must be built before contentscript
    // because inpage bundle result is included inside contentscript
    const contentscriptSubtask = createTask(
      `${taskPrefix}:contentscript`,
      createTaskForBundleContentscript({ devMode, testing }),
    );

    // this can run whenever
    const disableConsoleSubtask = createTask(
      `${taskPrefix}:disable-console`,
      createTaskForBundleDisableConsole({ devMode, testing }),
    );

    // this can run whenever
    const installSentrySubtask = createTask(
      `${taskPrefix}:sentry`,
      createTaskForBundleSentry({ devMode, testing }),
    );

    const phishingDetectSubtask = createTask(
      `${taskPrefix}:phishing-detect`,
      createTaskForBundlePhishingDetect({ devMode, testing }),
    );

    // task for initiating browser livereload
    const initiateLiveReload = async () => {
      if (devMode) {
        // trigger live reload when the bundles are updated
        // this is not ideal, but overcomes the limitations:
        // - run from the main process (not child process tasks)
        // - after the first build has completed (thus the timeout)
        // - build tasks never "complete" when run with livereload + child process
        setTimeout(() => {
          watch('./dist/*/*.js', (event) => {
            livereload.changed(event.path);
          });
        }, 75e3);
      }
    };

    // make each bundle run in a separate process
    const allSubtasks = [
      standardSubtask,
      contentscriptSubtask,
      disableConsoleSubtask,
      installSentrySubtask,
      phishingDetectSubtask,
    ].map((subtask) =>
      runInChildProcess(subtask, {
        applyLavaMoat,
        buildType,
        isLavaMoat,
        policyOnly,
        shouldLintFenceFiles,
      }),
    );
    // make a parent task that runs each task in a child thread
    return composeParallel(initiateLiveReload, ...allSubtasks);
  }

  function createTaskForBundleDisableConsole({ devMode, testing }) {
    const label = 'disable-console';
    return createNormalBundle({
      browserPlatforms,
      buildType,
      destFilepath: `${label}.js`,
      devMode,
      entryFilepath: `./app/scripts/${label}.js`,
      ignoredFiles,
      label,
      testing,
      policyOnly,
      shouldLintFenceFiles,
      version,
    });
  }

  function createTaskForBundleSentry({ devMode, testing }) {
    const label = 'sentry-install';
    return createNormalBundle({
      browserPlatforms,
      buildType,
      destFilepath: `${label}.js`,
      devMode,
      entryFilepath: `./app/scripts/${label}.js`,
      ignoredFiles,
      label,
      testing,
      policyOnly,
      shouldLintFenceFiles,
      version,
    });
  }

  function createTaskForBundlePhishingDetect({ devMode, testing }) {
    const label = 'phishing-detect';
    return createNormalBundle({
      buildType,
      browserPlatforms,
      destFilepath: `${label}.js`,
      devMode,
      entryFilepath: `./app/scripts/${label}.js`,
      ignoredFiles,
      label,
      testing,
      policyOnly,
      shouldLintFenceFiles,
      version,
    });
  }

  // the "contentscript" bundle contains the "inpage" bundle
  function createTaskForBundleContentscript({ devMode, testing }) {
    const inpage = 'inpage';
    const contentscript = 'contentscript';
    return composeSeries(
      createNormalBundle({
        buildType,
        browserPlatforms,
        destFilepath: `${inpage}.js`,
        devMode,
        entryFilepath: `./app/scripts/${inpage}.js`,
        label: inpage,
        ignoredFiles,
        policyOnly,
        shouldLintFenceFiles,
        testing,
        version,
      }),
      createNormalBundle({
        buildType,
        browserPlatforms,
        destFilepath: `${contentscript}.js`,
        devMode,
        entryFilepath: `./app/scripts/${contentscript}.js`,
        label: contentscript,
        ignoredFiles,
        policyOnly,
        shouldLintFenceFiles,
        testing,
        version,
      }),
    );
  }
}

function createFactoredBuild({
  applyLavaMoat,
  browserPlatforms,
  buildType,
  devMode,
  entryFiles,
  ignoredFiles,
  policyOnly,
  shouldLintFenceFiles,
  testing,
  version,
  buildPlatform,
}) {
  return async function () {
    // create bundler setup and apply defaults
    const buildConfiguration = createBuildConfiguration();
    buildConfiguration.label = 'primary';
    const { bundlerOpts, events } = buildConfiguration;

    // devMode options
    const reloadOnChange = Boolean(devMode);
    const minify = Boolean(devMode) === false;

    const envVars = getEnvironmentVariables({
      buildType,
      devMode,
      testing,
      version,
    });
    setupBundlerDefaults(buildConfiguration, {
      buildType,
      devMode,
      envVars,
      ignoredFiles,
      policyOnly,
      minify,
      reloadOnChange,
      shouldLintFenceFiles,
      testing,
    });

    // set bundle entries
    bundlerOpts.entries = [...entryFiles];

    // setup lavamoat
    // lavamoat will add lavapack but it will be removed by bify-module-groups
    // we will re-add it later by installing a lavapack runtime
    const lavamoatOpts = {
      policy: path.resolve(
        __dirname,
        `../../lavamoat/browserify/${buildType}/policy.json`,
      ),
      policyName: buildType,
      policyOverride: path.resolve(
        __dirname,
        `../../lavamoat/browserify/policy-override.json`,
      ),
      writeAutoPolicy: process.env.WRITE_AUTO_POLICY,
    };
    Object.assign(bundlerOpts, lavamoatBrowserify.args);
    bundlerOpts.plugin.push([lavamoatBrowserify, lavamoatOpts]);

    // setup bundle factoring with bify-module-groups plugin
    // note: this will remove lavapack, but its ok bc we manually readd it later
    Object.assign(bundlerOpts, bifyModuleGroups.plugin.args);
    bundlerOpts.plugin = [...bundlerOpts.plugin, [bifyModuleGroups.plugin]];

    // instrument pipeline
    let sizeGroupMap;
    events.on('configurePipeline', ({ pipeline }) => {
      // to be populated by the group-by-size transform
      sizeGroupMap = new Map();
      if (buildPlatform !== 'desktop') {
        pipeline.get('groups').unshift(
          // factor modules
          bifyModuleGroups.groupByFactor({
            entryFileToLabel(filepath) {
              return path.parse(filepath).name;
            },
          }),
          // cap files at 2 mb
          bifyModuleGroups.groupBySize({
            sizeLimit: 2e6,
            groupingMap: sizeGroupMap,
          }),
        );
      }
      // converts each module group into a single vinyl file containing its bundle
      const moduleGroupPackerStream = streamFlatMap((moduleGroup) => {
        const filename = `${moduleGroup.label}.js`;
        const childStream = wrapInStream(
          moduleGroup.stream,
          // we manually readd lavapack here bc bify-module-groups removes it
          lavapack({ raw: true, hasExports: true, includePrelude: false }),
          source(filename),
        );
        return childStream;
      });
      pipeline.get('vinyl').unshift(moduleGroupPackerStream, buffer());
      if (buildPlatform === 'desktop') {
        pipeline.get('vinyl').push(lavamoatDesktopStream(lavamoatOpts));
      } else {
        // add lavamoat policy loader file to packer output
        moduleGroupPackerStream.push(
          new Vinyl({
            path: 'policy-load.js',
            contents: lavapack.makePolicyLoaderStream(lavamoatOpts),
          }),
        );
      }
      // setup bundle destination
      browserPlatforms.forEach((platform) => {
        const dest = `./dist/${platform}/`;
        const destination = policyOnly ? noopWriteStream : gulp.dest(dest);
        pipeline.get('dest').push(destination);
      });
    });

    // wait for bundle completion for postprocessing
    events.on('bundleDone', () => {
      // Skip HTML generation if nothing is to be written to disk
      if (policyOnly) {
        return;
      }
      const commonSet = sizeGroupMap.get('common');
      // create entry points for each file
      for (const [groupLabel, groupSet] of sizeGroupMap.entries()) {
        // skip "common" group, they are added to all other groups
        if (groupSet === commonSet) {
          continue;
        }

        switch (groupLabel) {
          case 'ui': {
            renderHtmlFile({
              htmlName: 'popup',
              groupSet,
              commonSet,
              browserPlatforms,
              applyLavaMoat,
            });
            renderHtmlFile({
              htmlName: 'notification',
              groupSet,
              commonSet,
              browserPlatforms,
              applyLavaMoat,
            });
            renderHtmlFile({
              htmlName: 'home',
              groupSet,
              commonSet,
              browserPlatforms,
              applyLavaMoat,
            });
            break;
          }
          case 'background': {
            renderHtmlFile({
              htmlName: 'background',
              groupSet,
              commonSet,
              browserPlatforms,
              applyLavaMoat,
            });
            break;
          }
          case 'content-script': {
            renderHtmlFile({
              htmlName: 'trezor-usb-permissions',
              groupSet,
              commonSet,
              browserPlatforms,
              applyLavaMoat: false,
            });
            break;
          }
          case 'desktop':
            // No HTML please
            break;
          default: {
            throw new Error(
              `build/scripts - unknown groupLabel "${groupLabel}"`,
            );
          }
        }
      }
    });

    await bundleIt(buildConfiguration, { reloadOnChange });
  };
}

function createNormalBundle({
  browserPlatforms,
  buildType,
  destFilepath,
  devMode,
  entryFilepath,
  extraEntries = [],
  ignoredFiles,
  label,
  policyOnly,
  modulesToExpose,
  shouldLintFenceFiles,
  testing,
  version,
}) {
  return async function () {
    // create bundler setup and apply defaults
    const buildConfiguration = createBuildConfiguration();
    buildConfiguration.label = label;
    const { bundlerOpts, events } = buildConfiguration;

    // devMode options
    const reloadOnChange = Boolean(devMode);
    const minify = Boolean(devMode) === false;

    const envVars = getEnvironmentVariables({
      buildType,
      devMode,
      testing,
      version,
    });
    setupBundlerDefaults(buildConfiguration, {
      buildType,
      devMode,
      envVars,
      ignoredFiles,
      policyOnly,
      minify,
      reloadOnChange,
      shouldLintFenceFiles,
      testing,
    });

    // set bundle entries
    bundlerOpts.entries = [...extraEntries];
    if (entryFilepath) {
      bundlerOpts.entries.push(entryFilepath);
    }

    if (modulesToExpose) {
      bundlerOpts.require = bundlerOpts.require.concat(modulesToExpose);
    }

    // instrument pipeline
    events.on('configurePipeline', ({ pipeline }) => {
      // convert bundle stream to gulp vinyl stream
      // and ensure file contents are buffered
      pipeline.get('vinyl').push(source(destFilepath));
      pipeline.get('vinyl').push(buffer());
      // setup bundle destination
      browserPlatforms.forEach((platform) => {
        const dest = `./dist/${platform}/`;
        const destination = policyOnly ? noopWriteStream : gulp.dest(dest);
        pipeline.get('dest').push(destination);
      });
    });

    await bundleIt(buildConfiguration, { reloadOnChange });
  };
}

function createBuildConfiguration() {
  const label = '(unnamed bundle)';
  const events = new EventEmitter();
  const bundlerOpts = {
    entries: [],
    transform: [],
    plugin: [],
    require: [],
    // non-standard bify options
    manualExternal: [],
    manualIgnore: [],
  };
  return { bundlerOpts, events, label };
}

function setupBundlerDefaults(
  buildConfiguration,
  {
    buildType,
    devMode,
    envVars,
    ignoredFiles,
    policyOnly,
    minify,
    reloadOnChange,
    shouldLintFenceFiles,
    testing,
  },
) {
  const { bundlerOpts } = buildConfiguration;
  const extensions = ['.js', '.ts', '.tsx'];

  Object.assign(bundlerOpts, {
    // Source transforms
    transform: [
      // Remove code that should be excluded from builds of the current type
      createRemoveFencedCodeTransform(buildType, shouldLintFenceFiles),
      // Transpile top-level code
      [
        babelify,
        // Run TypeScript files through Babel
        { extensions },
      ],
      // Inline `fs.readFileSync` files
      brfs,
    ],
    // Look for TypeScript files when walking the dependency tree
    extensions,
    // Use entryFilepath for moduleIds, easier to determine origin file
    fullPaths: devMode,
    // For sourcemaps
    debug: true,
  });

  // Ensure react-devtools are not included in non-dev builds
  if (!devMode || testing) {
    bundlerOpts.manualIgnore.push('react-devtools');
    bundlerOpts.manualIgnore.push('remote-redux-devtools');
  }

  // Inject environment variables via node-style `process.env`
  if (envVars) {
    bundlerOpts.transform.push([envify(envVars), { global: true }]);
  }

  // Ensure that any files that should be ignored are excluded from the build
  if (ignoredFiles) {
    bundlerOpts.manualExclude = ignoredFiles;
  }

  // Setup reload on change
  if (reloadOnChange) {
    setupReloadOnChange(buildConfiguration);
  }

  if (!policyOnly) {
    if (minify) {
      setupMinification(buildConfiguration);
    }

    // Setup source maps
    setupSourcemaps(buildConfiguration, { devMode });
  }
}

function setupReloadOnChange({ bundlerOpts, events }) {
  // Add plugin to options
  Object.assign(bundlerOpts, {
    plugin: [...bundlerOpts.plugin, watchify],
    // Required by watchify
    cache: {},
    packageCache: {},
  });
  // Instrument pipeline
  events.on('configurePipeline', ({ bundleStream }) => {
    // Handle build error to avoid breaking build process
    // (eg on syntax error)
    bundleStream.on('error', (err) => {
      gracefulError(err);
    });
  });
}

function setupMinification(buildConfiguration) {
  const minifyOpts = {
    mangle: {
      reserved: ['MetamaskInpageProvider'],
    },
  };
  const { events } = buildConfiguration;
  events.on('configurePipeline', ({ pipeline }) => {
    pipeline.get('minify').push(
      // this is the "gulp-terser-js" wrapper around the latest version of terser
      through.obj(
        callbackify(async (file, _enc) => {
          const input = {
            [file.sourceMap.file]: file.contents.toString(),
          };
          const opts = {
            sourceMap: {
              filename: file.sourceMap.file,
              content: file.sourceMap,
            },
            ...minifyOpts,
          };
          const res = await terser.minify(input, opts);
          file.contents = Buffer.from(res.code);
          applySourceMap(file, res.map);
          return file;
        }),
      ),
    );
  });
}

function setupSourcemaps(buildConfiguration, { devMode }) {
  const { events } = buildConfiguration;
  events.on('configurePipeline', ({ pipeline }) => {
    pipeline.get('sourcemaps:init').push(sourcemaps.init({ loadMaps: true }));
    pipeline
      .get('sourcemaps:write')
      // Use inline source maps for development due to Chrome DevTools bug
      // https://bugs.chromium.org/p/chromium/issues/detail?id=931675
      .push(
        devMode
          ? sourcemaps.write()
          : sourcemaps.write('../sourcemaps', { addComment: false }),
      );
  });
}

async function bundleIt(buildConfiguration, { reloadOnChange }) {
  const { label, bundlerOpts, events } = buildConfiguration;
  const bundler = browserify(bundlerOpts);

  // manually apply non-standard options
  bundler.external(bundlerOpts.manualExternal);
  bundler.ignore(bundlerOpts.manualIgnore);
  if (Array.isArray(bundlerOpts.manualExclude)) {
    bundler.exclude(bundlerOpts.manualExclude);
  }

  // output build logs to terminal
  bundler.on('log', log);

  // forward update event (used by watchify)
  bundler.on('update', () => performBundle());

  console.log(`Bundle start: "${label}"`);
  await performBundle();
  console.log(`Bundle end: "${label}"`);

  async function performBundle() {
    // this pipeline is created for every bundle
    // the labels are all the steps you can hook into
    const pipeline = labeledStreamSplicer([
      'groups',
      [],
      'vinyl',
      [],
      'sourcemaps:init',
      [],
      'minify',
      [],
      'sourcemaps:write',
      [],
      'dest',
      [],
    ]);
    const bundleStream = bundler.bundle();
    if (!reloadOnChange) {
      bundleStream.on('error', (error) => {
        console.error('Bundling failed! See details below.');
        console.error(error.stack || error);
        process.exit(1);
      });
    }
    // trigger build pipeline instrumentations
    events.emit('configurePipeline', { pipeline, bundleStream });
    // start bundle, send into pipeline
    bundleStream.pipe(pipeline);
    // nothing will consume pipeline, so let it flow
    pipeline.resume();

    await endOfStream(pipeline);

    // call the completion event to handle any post-processing
    events.emit('bundleDone');
  }
}

function getEnvironmentVariables({ buildType, devMode, testing, version }) {
  const environment = getEnvironment({ devMode, testing });
  if (environment === ENVIRONMENT.PRODUCTION && !process.env.SENTRY_DSN) {
    throw new Error('Missing SENTRY_DSN environment variable');
  }
  return {
    METAMASK_DEBUG: devMode,
    METAMASK_ENVIRONMENT: environment,
    METAMASK_VERSION: version,
    METAMASK_BUILD_TYPE: buildType,
    NODE_ENV: devMode ? ENVIRONMENT.DEVELOPMENT : ENVIRONMENT.PRODUCTION,
    IN_TEST: testing,
    PUBNUB_SUB_KEY: process.env.PUBNUB_SUB_KEY || '',
    PUBNUB_PUB_KEY: process.env.PUBNUB_PUB_KEY || '',
    CONF: devMode ? metamaskrc : {},
    SENTRY_DSN: process.env.SENTRY_DSN,
    SENTRY_DSN_DEV: metamaskrc.SENTRY_DSN_DEV,
    INFURA_PROJECT_ID: getInfuraProjectId({ buildType, environment, testing }),
    SEGMENT_HOST: metamaskrc.SEGMENT_HOST,
    SEGMENT_WRITE_KEY: getSegmentWriteKey({ buildType, environment }),
    SWAPS_USE_DEV_APIS: process.env.SWAPS_USE_DEV_APIS === '1',
    ONBOARDING_V2: metamaskrc.ONBOARDING_V2 === '1',
    COLLECTIBLES_V1: metamaskrc.COLLECTIBLES_V1 === '1',
    TOKEN_DETECTION_V2: metamaskrc.TOKEN_DETECTION_V2 === '1',
  };
}

function getEnvironment({ devMode, testing }) {
  // get environment slug
  if (devMode) {
    return ENVIRONMENT.DEVELOPMENT;
  } else if (testing) {
    return ENVIRONMENT.TESTING;
  } else if (process.env.CIRCLE_BRANCH === 'master') {
    return ENVIRONMENT.PRODUCTION;
  } else if (
    /^Version-v(\d+)[.](\d+)[.](\d+)/u.test(process.env.CIRCLE_BRANCH)
  ) {
    return ENVIRONMENT.RELEASE_CANDIDATE;
  } else if (process.env.CIRCLE_BRANCH === 'develop') {
    return ENVIRONMENT.STAGING;
  } else if (process.env.CIRCLE_PULL_REQUEST) {
    return ENVIRONMENT.PULL_REQUEST;
  }
  return ENVIRONMENT.OTHER;
}

function renderHtmlFile({
  htmlName,
  groupSet,
  commonSet,
  browserPlatforms,
  applyLavaMoat,
}) {
  if (applyLavaMoat === undefined) {
    throw new Error(
      'build/scripts/renderHtmlFile - must specify "applyLavaMoat" option',
    );
  }
  const htmlFilePath = `./app/${htmlName}.html`;
  const htmlTemplate = readFileSync(htmlFilePath, 'utf8');
  const jsBundles = [...commonSet.values(), ...groupSet.values()].map(
    (label) => `./${label}.js`,
  );
  const htmlOutput = Sqrl.render(htmlTemplate, { jsBundles, applyLavaMoat });
  browserPlatforms.forEach((platform) => {
    const dest = `./dist/${platform}/${htmlName}.html`;
    // we dont have a way of creating async events atm
    writeFileSync(dest, htmlOutput);
  });
}

function beep() {
  process.stdout.write('\x07');
}

function gracefulError(err) {
  console.warn(err);
  beep();
}
