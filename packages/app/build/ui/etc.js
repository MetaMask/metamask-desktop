const del = require('del');
const { TASKS } = require('./constants');
const { createTask } = require('./task');

module.exports = createEtcTasks;

function createEtcTasks() {
  const clean = createTask(TASKS.CLEAN, async function clean() {
    await del(['./dist/ui/*'], { force: true });
  });

  return { clean };
}
