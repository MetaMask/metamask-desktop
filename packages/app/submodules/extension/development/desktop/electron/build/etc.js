const del = require('del');
const { TASKS } = require('../../../build/constants');
const { createTask } = require('./task');

module.exports = createEtcTasks;

function createEtcTasks() {
  const clean = createTask(TASKS.CLEAN, async function clean() {
    await del(['./dist_desktop_ui/*']);
  });

  return { clean };
}
