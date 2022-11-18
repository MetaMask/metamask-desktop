import { test as base } from '../helpers/extension-loader';
import Ganache from '../helpers/ganache';

type GanacheWorkerFixtures = {
  ganache: Ganache;
};

const test = base.extend<{}, GanacheWorkerFixtures>({
  // "express" fixture starts automatically for every worker - we pass "auto" for that.
  ganache: [
    async ({}, use) => {
      const ganacheOptions = {};

      const ganacheServer = new Ganache();
      console.log('Starting Ganache...');
      await ganacheServer.start(ganacheOptions);

      // Use the server in the tests.
      await use(ganacheServer);

      // Cleanup.
      console.log('Stopping Ganache...');
      await new Promise(() => ganacheServer.quit());
      console.log('Ganache stopped');
    },
    { scope: 'worker', auto: true },
  ],
});

export default test;
