/* eslint-disable node/no-unpublished-require */
/* eslint-disable node/no-process-env */
/* eslint-disable node/no-process-exit */
/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable jsdoc/require-returns */
const { callbackify } = require('util');
const path = require('path');
const { writeFileSync, readFileSync } = require('fs');
const EventEmitter = require('events');
const gulp = require('gulp');
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

const {
  streamFlatMap,
} = require('../../submodules/extension/development/stream-flat-map');
const {
  generateIconNames,
} = require('../../submodules/extension/development/generate-icon-names');
const {
  BUILD_TARGETS,
  ENVIRONMENT,
} = require('../../submodules/extension/development/build/constants');
const {
  getConfig,
} = require('../../submodules/extension/development/build/config');
const {
  isDevBuild,
  getEnvironment,
  logError,
} = require('../../submodules/extension/development/build/utils');
const { runInChildProcess, createTask, composeParallel } = require('./task');

/**
 * Get the appropriate Segment write key.
 *
 * @param {object} options - The Segment write key options.
 * @param {object} options.config - The environment variable configuration.
 * @param {keyof ENVIRONMENT} options.environment - The current build environment.
 * @returns {string} The Segment write key.
 */
function getSegmentWriteKey({ config, environment }) {
  if (environment !== ENVIRONMENT.PRODUCTION) {
    // Skip validation because this is unset on PRs from forks, and isn't necessary for development builds.
    return config.SEGMENT_WRITE_KEY;
  }
  return config.SEGMENT_PROD_WRITE_KEY;
}

const noopWriteStream = through.obj((_file, _fileEncoding, callback) =>
  callback(),
);

module.exports = createScriptTasks;

/**
 * Create tasks for building JavaScript bundles and templates. One
 * task is returned for each build target. These build target tasks are
 * each composed of smaller tasks.
 *
 * @param {object} options - Build options.
 * @param {boolean} options.applyLavaMoat - Whether the build should use
 * LavaMoat at runtime or not.
 * @param {BuildType} options.buildType - The current build type (e.g. "main",
 * "flask", etc.).
 * @param {boolean} options.policyOnly - Whether to stop the build after
 * generating the LavaMoat policy, skipping any writes to disk other than the
 * LavaMoat policy itself.
 * @returns {object} A set of tasks, one for each build target.
 */
function createScriptTasks({ applyLavaMoat, buildType, policyOnly }) {
  // high level tasks
  return {
    // dev tasks
    dev: createTasksForScriptBundles({
      buildTarget: BUILD_TARGETS.DEV,
      taskPrefix: 'scripts:core:dev',
    }),
    // production-like distributable build
    dist: createTasksForScriptBundles({
      buildTarget: BUILD_TARGETS.DIST,
      taskPrefix: 'scripts:core:dist',
    }),
    // production
    prod: createTasksForScriptBundles({
      buildTarget: BUILD_TARGETS.PROD,
      taskPrefix: 'scripts:core:prod',
    }),
  };

  /**
   * Define tasks for building the JavaScript modules used by the extension.
   * This function returns a single task that builds JavaScript modules in
   * parallel for a single type of build (e.g. dev, testing, production).
   *
   * @param {object} options - The build options.
   * @param {BUILD_TARGETS} options.buildTarget - The build target that these
   * JavaScript modules are intended for.
   * @param {string} options.taskPrefix - The prefix to use for the name of
   * each defined task.
   */
  function createTasksForScriptBundles({ buildTarget, taskPrefix }) {
    const standardSubtask = createTask(
      `${taskPrefix}:standardEntryPoints:desktopui`,
      createFactoredBuild({
        applyLavaMoat,
        buildTarget,
        buildType,
        entryFiles: ['desktop-ui'].map((label) => {
          return `./src/${label}.js`;
        }),
        policyOnly,
      }),
    );

    const allSubtasks = [standardSubtask].map((subtask) =>
      runInChildProcess(subtask, {
        applyLavaMoat,
        buildType,
        policyOnly,
      }),
    );
    // make a parent task that runs each task in a child thread
    return composeParallel(...allSubtasks);
  }
}

/**
 * Return a function that creates a set of factored bundles.
 *
 * For each entry point, a series of one or more bundles is created. These are
 * split up roughly by size, to ensure no single bundle exceeds the maximum
 * JavaScript file size imposed by Firefox.
 *
 * Modules that are common between all entry points are bundled separately, as
 * a set of one or more "common" bundles.
 *
 * @param {object} options - Build options.
 * @param {boolean} options.applyLavaMoat - Whether the build should use
 * LavaMoat at runtime or not.
 * @param {BUILD_TARGETS} options.buildTarget - The current build target.
 * @param {BuildType} options.buildType - The current build type (e.g. "main",
 * "flask", etc.).
 * @param {string[]} options.entryFiles - A list of entry point file paths,
 * relative to the repository root directory.
 * @param {boolean} options.policyOnly - Whether to stop the build after
 * generating the LavaMoat policy, skipping any writes to disk other than the
 * LavaMoat policy itself.
 * @returns {Function} A function that creates the set of bundles.
 */
function createFactoredBuild({
  applyLavaMoat,
  buildTarget,
  buildType,
  entryFiles,
  policyOnly,
}) {
  return async function () {
    // create bundler setup and apply defaults
    const buildConfiguration = createBuildConfiguration();
    buildConfiguration.label = 'primary';
    const { bundlerOpts, events } = buildConfiguration;

    // devMode options
    const reloadOnChange = isDevBuild(buildTarget);
    const minify = !isDevBuild(buildTarget);

    const envVars = await getEnvironmentVariables({
      buildTarget,
      buildType,
    });
    setupBundlerDefaults(buildConfiguration, {
      buildTarget,
      envVars,
      policyOnly,
      minify,
      reloadOnChange,
    });

    // set bundle entries
    bundlerOpts.entries = [...entryFiles];

    // setup lavamoat
    // lavamoat will add lavapack but it will be removed by bify-module-groups
    // we will re-add it later by installing a lavapack runtime
    const lavamoatOpts = {
      policy: path.resolve(
        __dirname,
        `../../lavamoat/ui/browserify/policy.json`,
      ),
      policyName: buildType,
      policyOverride: path.resolve(
        __dirname,
        `../../lavamoat/ui/browserify/policy-override.json`,
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
      // add lavamoat policy loader file to packer output
      moduleGroupPackerStream.push(
        new Vinyl({
          path: 'policy-load.js',
          contents: lavapack.makePolicyLoaderStream(lavamoatOpts),
        }),
      );

      const dest = `./dist/ui/`;
      const destination = policyOnly ? noopWriteStream : gulp.dest(dest);
      pipeline.get('dest').push(destination);
    });

    // wait for bundle completion for postprocessing
    events.on('bundleDone', async () => {
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
          case 'desktop-ui': {
            renderHtmlFile({
              htmlName: 'desktop-ui',
              groupSet,
              commonSet,
              applyLavaMoat,
            });
            break;
          }

          default: {
            throw new Error(
              `build/scripts - unknown groupLabel "${groupLabel}"`,
            );
          }
        }
      }
      console.log('Bundling done!');
    });

    await createBundle(buildConfiguration, { reloadOnChange });
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
  { buildTarget, envVars, policyOnly, minify, reloadOnChange },
) {
  const { bundlerOpts } = buildConfiguration;
  const extensions = ['.js', '.ts', '.tsx'];

  Object.assign(bundlerOpts, {
    // Source transforms
    transform: [
      // Transpile top-level code
      [
        babelify.configure({ extends: './babel-ui.config.js' }),
        // Run TypeScript files through Babel
        { extensions },
      ],
      // Inline `fs.readFileSync` files
      brfs,
    ],
    // Look for TypeScript files when walking the dependency tree
    extensions,
    // Use entryFilepath for moduleIds, easier to determine origin file
    fullPaths: isDevBuild(buildTarget),
    // For sourcemaps
    debug: true,
  });

  // Ensure react-devtools is only included in dev builds
  if (buildTarget !== BUILD_TARGETS.DEV) {
    bundlerOpts.manualIgnore.push('react-devtools');
    bundlerOpts.manualIgnore.push('remote-redux-devtools');
  }

  // Inject environment variables via node-style `process.env`
  if (envVars) {
    bundlerOpts.transform.push([envify(envVars), { global: true }]);
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
    setupSourcemaps(buildConfiguration, { buildTarget });
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
      console.log(err);
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

function setupSourcemaps(buildConfiguration, { buildTarget }) {
  const { events } = buildConfiguration;
  events.on('configurePipeline', ({ pipeline }) => {
    pipeline.get('sourcemaps:init').push(sourcemaps.init({ loadMaps: true }));
    pipeline
      .get('sourcemaps:write')
      // Use inline source maps for development due to Chrome DevTools bug
      // https://bugs.chromium.org/p/chromium/issues/detail?id=931675
      .push(
        isDevBuild(buildTarget)
          ? sourcemaps.write({
              sourceRoot: '/packages/app/',
            })
          : sourcemaps.write('./sourcemaps', {
              addComment: false,
            }),
      );
  });
}

async function createBundle(buildConfiguration, { reloadOnChange }) {
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
  bundler.on('update', () => {
    console.log('Changes detected, bundling...');
    performBundle();
  });

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
        logError(error);
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

/**
 * Get environment variables to inject in the current build.
 *
 * @param {object} options - Build options.
 * @param {BUILD_TARGETS} options.buildTarget - The current build target.
 * @param {BuildType} options.buildType - The current build type (e.g. "main",
 * "flask", etc.).
 * @returns {object} A map of environment variables to inject.
 */
async function getEnvironmentVariables({ buildTarget, buildType }) {
  const environment = getEnvironment({ buildTarget });
  const config = await getConfig();

  const devMode = isDevBuild(buildTarget);
  const iconNames = await generateIconNames();
  return {
    CONF: devMode ? config : {},
    DISABLE_WEB_SOCKET_ENCRYPTION: config.DISABLE_WEB_SOCKET_ENCRYPTION === '1',
    ICON_NAMES: iconNames,
    SKIP_OTP_PAIRING_FLOW: config.SKIP_OTP_PAIRING_FLOW === '1',
    METAMASK_DEBUG: devMode || config.METAMASK_DEBUG === '1',
    METAMASK_ENVIRONMENT: environment,
    METAMASK_BUILD_TYPE: buildType,
    NODE_ENV: devMode ? ENVIRONMENT.DEVELOPMENT : ENVIRONMENT.PRODUCTION,
    SEGMENT_HOST: config.SEGMENT_HOST,
    SEGMENT_WRITE_KEY: getSegmentWriteKey({ buildType, config, environment }),
    SENTRY_DSN: config.SENTRY_DSN,
    SENTRY_DSN_DEV: config.SENTRY_DSN_DEV,
  };
}

function renderHtmlFile({ htmlName, groupSet, commonSet, applyLavaMoat }) {
  if (applyLavaMoat === undefined) {
    throw new Error(
      'build/scripts/renderHtmlFile - must specify "applyLavaMoat" option',
    );
  }
  const htmlFilePath = `./html/${htmlName}.html`;
  const htmlTemplate = readFileSync(htmlFilePath, 'utf8');
  const jsBundles = [...commonSet.values(), ...groupSet.values()].map(
    (label) => `./${label}.js`,
  );
  const htmlOutput = Sqrl.render(htmlTemplate, { jsBundles, applyLavaMoat });

  const dest = `./dist/ui/${htmlName}.html`;
  writeFileSync(dest, htmlOutput);
}

function beep() {
  process.stdout.write('\x07');
}

function gracefulError(err) {
  console.warn(err);
  beep();
}
