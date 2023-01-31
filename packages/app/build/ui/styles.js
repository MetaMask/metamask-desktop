const pify = require('pify');
const gulp = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const watch = require('gulp-watch');
const sourcemaps = require('gulp-sourcemaps');
const rtlcss = require('gulp-rtlcss');
const rename = require('gulp-rename');
const pump = pify(require('pump'));
const { TASKS } = require('./constants');
const { createTask } = require('./task');

let sass;

// scss compilation and autoprefixing tasks
module.exports = createStyleTasks;

function createStyleTasks() {
  const prod = createTask(
    TASKS.STYLES_PROD,
    createScssBuildTask({
      src: 'ui/css/index.scss',
      dest: 'ui/css/output',
      devMode: false,
    }),
  );

  const dev = createTask(
    TASKS.STYLES_DEV,
    createScssBuildTask({
      src: 'ui/css/index.scss',
      dest: 'ui/css/output',
      devMode: true,
      pattern: '{ui, submodules/extension/ui}/**/*.scss',
    }),
  );

  return { prod, dev };

  function createScssBuildTask({ src, dest, devMode, pattern }) {
    return async function () {
      if (devMode) {
        watch(pattern, async () => {
          await buildScss();
        });
      }
      await buildScss();
    };

    async function buildScss() {
      await Promise.all([
        buildScssPipeline(src, dest, devMode, false),
        buildScssPipeline(src, dest, devMode, true),
      ]);
    }
  }
}

async function buildScssPipeline(src, dest, devMode, rtl) {
  if (!sass) {
    // eslint-disable-next-line node/global-require
    sass = require('gulp-dart-sass');
    // use our own compiler which runs sass in its own process
    // in order to not pollute the intrinsics
    // eslint-disable-next-line node/global-require
    sass.compiler = require('../../submodules/extension/development/build/sass-compiler');
  }

  await pump(
    ...[
      // pre-process
      gulp.src(src),
      devMode && sourcemaps.init(),
      sass({ includePaths: ['submodules/extension/ui/css/', 'ui/'] }).on(
        'error',
        sass.logError,
      ),
      autoprefixer(),
      rtl && rtlcss(),
      rtl && rename({ suffix: '-rtl' }),
      devMode && sourcemaps.write(),
      gulp.dest(dest),
    ].filter(Boolean),
  );
}
