const path = require('path');
const fs = require('fs-extra');
const watch = require('gulp-watch');
const glob = require('fast-glob');

const { TASKS } = require('./constants');
const { createTask, composeSeries } = require('./task');

const EMPTY_JS_FILE = '../../submodules/extension/development/empty.js';

module.exports = function createStaticAssetTasks({
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
    watch(target.src + pattern, () => {
      performCopy(target);
    });
    await performCopy(target);
  }

  async function performCopy(target) {
    if (target.pattern) {
      await copyGlob(
        target.src,
        `${target.src}${target.pattern}`,
        `./dist/ui/${target.dest}`,
      );
      return;
    }

    await copyGlob(target.src, `${target.src}`, `./dist/ui/${target.dest}`);
  }

  async function copyGlob(baseDir, srcGlob, dest) {
    const fixedSrcGlob =
      process.platform === 'win32' ? srcGlob.replace(/\\/gu, '/') : srcGlob;

    const sources = await glob(fixedSrcGlob, { onlyFiles: false });
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
      src: `./submodules/extension/app/fonts/`,
      dest: `fonts`,
    },
    {
      src: `./submodules/extension/app/vendor/`,
      dest: `vendor`,
    },
    {
      src: `./submodules/extension/app/_locales/`,
      dest: `_locales`,
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
      src: `./src/ui/css/output/`,
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
      src: './submodules/extension/app/scripts/init-globals.js',
      dest: 'init-globals.js',
    },
    {
      src: shouldIncludeLockdown
        ? `./submodules/extension/app/scripts/lockdown-run.js`
        : EMPTY_JS_FILE,
      dest: `lockdown-run.js`,
    },
    {
      src: shouldIncludeLockdown
        ? `./submodules/extension/app/scripts/lockdown-more.js`
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
    {
      src: `./src/app/icons/`,
      pattern: `*.png`,
      dest: `../app/src/app/icons/`,
    },
  ];

  const copyTargetsDev = [
    ...allCopyTargets,
    {
      src: './submodules/extension/development',
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
