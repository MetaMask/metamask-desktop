const fs = require('fs');
const through2 = require('through2').obj;

module.exports = lavaMoatPolicyStream;

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

// Stream that prepends the LavaMoat policy to the output file
function lavaMoatPolicyStream(lavamoatOpts) {
  const stream = through2(write);
  const policy = loadPolicy(lavamoatOpts);
  const policyLoaderContent = `LavaPack.loadPolicy(${JSON.stringify(
    policy,
    null,
    2,
  )});`;
  const policyBuffer = Buffer.from(policyLoaderContent, 'utf-8');

  return stream;

  function write(file, _, next) {
    file.contents = Buffer.concat([policyBuffer, file.contents]);
    next(null, file);
  }
}
