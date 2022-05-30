const fs = require('fs');
const through2 = require('through2').obj;

module.exports = lavamoatDesktopStream;

// Copied from makePolicyLoaderStream
function loadPolicy({ debugMode, policyPath }) {
  let policy = { resources: {} };
  // try policy
  if (fs.existsSync(policyPath)) {
    if (debugMode) {
      console.warn(`Lavamoat looking for policy at ${policyPath}`);
    }
    const configSource = fs.readFileSync(policyPath, 'utf8');
    policy = JSON.parse(configSource);
  } else if (debugMode) {
    console.warn('Lavamoat could not find policy');
  }
  return policy;
}

function loadFile(path) {
  const file = fs.readFileSync(path, 'utf8');
  return Buffer.from(file, 'utf-8');
}

// Stream that prepends the LavaMoat policy and other LavaMoat deps to the output file
function lavamoatDesktopStream(lavamoatOpts) {
  const stream = through2(write);
  const policy = loadPolicy({ policyPath: lavamoatOpts.policy });
  const policyLoaderContent = `LavaPack.loadPolicy(${JSON.stringify(
    policy,
    null,
    2,
  )});`;
  // @todo sentry-install.js
  const lavaMoatRuntime = loadFile(require.resolve('@lavamoat/lavapack/src/runtime.js'));
  const lockdownMore = loadFile(`./app/scripts/lockdown-more.js`);
  const policyBuffer = Buffer.from(policyLoaderContent, 'utf-8');

  return stream;

  function write(file, _, next) {
    file.contents = Buffer.concat([lavaMoatRuntime, lockdownMore, policyBuffer, file.contents]);
    next(null, file);
  }
}
