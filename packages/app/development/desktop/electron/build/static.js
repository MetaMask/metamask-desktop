const path = require('path');
const fs = require('fs-extra');
const watch = require('gulp-watch');
const glob = require('fast-glob');

const { createTask, composeSeries } = require('../../../build/task');
const { TASKS } = require('../../../build/constants');

const EMPTY_JS_FILE = './development/empty.js';

module.exports = function createStaticAssetTasks({
  livereload,
  shouldIncludeLockdown = true,
}) {
  const [copyTargetsProd, copyTargetsDev] = getCopyTargets(
    shouldIncludeLockdown,
  );

  const prod = createTask(
    TASKS.STATIC_PROD,
    composeSeries(
      ...copyTargetsProd.map((target) => {
        return async function copyStaticAssets() {
          await performCopy(target);
        };
      }),
    ),
  );
  const dev = createTask(
    TASKS.STATIC_DEV,
    composeSeries(
      ...copyTargetsDev.map((target) => {
        return async function copyStaticAssets() {
          await setupLiveCopy(target);
        };
      }),
    ),
  );

  return { dev, prod };

  async function setupLiveCopy(target) {
    const pattern = target.pattern || '/**/*';
    watch(target.src + pattern, (event) => {
      livereload.changed(event.path);
      performCopy(target);
    });
    await performCopy(target);
  }

  async function performCopy(target) {
    if (target.pattern) {
      await copyGlob(
        target.src,
        `${target.src}${target.pattern}`,
        `./dist_desktop_ui/${target.dest}`,
      );
      return;
    }

    await copyGlob(
      target.src,
      `${target.src}`,
      `./dist_desktop_ui/${target.dest}`,
    );
  }

  async function copyGlob(baseDir, srcGlob, dest) {
    const sources = await glob(srcGlob, { onlyFiles: false });
    await Promise.all(
      sources.map(async (src) => {
        const relativePath = path.relative(baseDir, src);
        await fs.copySync(src, `${dest}${relativePath}`);
      }),
    );
  }
};

function getCopyTargets(shouldIncludeLockdown) {
  const allCopyTargets = [
    {
      src: `./app/fonts/`,
      dest: `fonts`,
    },
    {
      src: `./app/vendor/`,
      dest: `vendor`,
    },
    {
      src: `./node_modules/@fortawesome/fontawesome-free/webfonts/`,
      dest: `fonts/fontawesome`,
    },
    {
      src: `./node_modules/react-responsive-carousel/lib/styles`,
      dest: 'react-gallery/',
    },
    {
      src: `./ui/css/output/`,
      pattern: `*.css`,
      dest: ``,
    },
    {
      src: `./node_modules/globalthis/dist/browser.js`,
      dest: `globalthis.js`,
    },
    {
      src: shouldIncludeLockdown
        ? `./node_modules/ses/dist/lockdown.umd.min.js`
        : EMPTY_JS_FILE,
      dest: `lockdown-install.js`,
    },
    {
      src: './app/scripts/init-globals.js',
      dest: 'init-globals.js',
    },
    {
      src: shouldIncludeLockdown
        ? `./app/scripts/lockdown-run.js`
        : EMPTY_JS_FILE,
      dest: `lockdown-run.js`,
    },
    {
      src: shouldIncludeLockdown
        ? `./app/scripts/lockdown-more.js`
        : EMPTY_JS_FILE,
      dest: `lockdown-more.js`,
    },
    {
      // eslint-disable-next-line node/no-extraneous-require
      src: require.resolve('@lavamoat/lavapack/src/runtime-cjs.js'),
      dest: `runtime-cjs.js`,
    },
    {
      // eslint-disable-next-line node/no-extraneous-require
      src: require.resolve('@lavamoat/lavapack/src/runtime.js'),
      dest: `runtime-lavamoat.js`,
    },
  ];

  const copyTargetsDev = [
    ...allCopyTargets,
    {
      src: './development',
      pattern: '/chromereload.js',
      dest: ``,
    },
    // empty files to suppress missing file errors
    {
      src: EMPTY_JS_FILE,
      dest: `bg-libs.js`,
    },
    {
      src: EMPTY_JS_FILE,
      dest: `ui-libs.js`,
    },
  ];

  const copyTargetsProd = [
    ...allCopyTargets,
    // empty files to suppress missing file errors
    {
      src: EMPTY_JS_FILE,
      dest: `chromereload.js`,
    },
  ];

  return [copyTargetsProd, copyTargetsDev];
}
