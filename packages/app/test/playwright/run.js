/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable node/no-process-env */
/* eslint-disable import/unambiguous */

const path = require('path');
const { promises: fs } = require('fs');
const {
  runInShell,
} = require('../../submodules/extension/development/lib/run-command');
const {
  exitWithError,
} = require('../../submodules/extension/development/lib/exit-with-error');

const getTestPathsForTestDir = async (testDir) => {
  const testFilenames = await fs.readdir(testDir);
  const testPaths = testFilenames.map((filename) =>
    path.join(testDir, filename),
  );
  return testPaths;
};

// Heavily inspired by: https://stackoverflow.com/a/51514813
// Splits the array into totalChunks chunks with a decent spread of items in each chunk
function chunk(array, totalChunks) {
  const copyArray = [...array];
  const result = [];
  for (let chunkIndex = totalChunks; chunkIndex > 0; chunkIndex--) {
    result.push(copyArray.splice(0, Math.ceil(copyArray.length / chunkIndex)));
  }
  return result;
}

async function main() {
  const testDir = path.join(__dirname, 'specs');
  const testPaths = await getTestPathsForTestDir(testDir);

  const relativeTestPaths = testPaths.map(
    (path) => `test/playwright${path.replace(__dirname, '')}`,
  );

  const currentChunkIndex = process.env.CIRCLE_NODE_INDEX ?? 0;
  const totalChunks = process.env.CIRCLE_NODE_TOTAL ?? 1;
  const chunks = chunk(relativeTestPaths, totalChunks);
  const currentChunk = chunks[currentChunkIndex];

  await runInShell('yarn', ['playwright', 'test', ...currentChunk]);
}

main().catch((error) => {
  exitWithError(error);
});
