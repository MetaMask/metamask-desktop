const del = require('del');
const { TASKS } = require('../../../build/constants');
const { createTask } = require('../../../build/task');

module.exports = createEtcTasks;

function createEtcTasks({ livereload }) {
  const clean = createTask(TASKS.CLEAN, async function clean() {
    await del(['./dist_desktop_ui/*']);
  });

  const reload = createTask(TASKS.RELOAD, function devReload() {
    livereload.listen({ port: 35728 });
  });

  return { clean, reload };
}
