// Used to automatically update a policy override file to synchronise policy generation on different platforms.
// e.g. node policy-diff.js [Locally Generated Policy File] [Local Override File] [CI Policy File Downloaded Via SSH]

const fs = require("fs");

const diffMap = (current, override, target, name, property) => {
  const currentValues = current[name]?.[property] || {};
  const targetValues = target[name]?.[property] || {};

  const allProperties = [
    ...Object.keys(currentValues),
    ...Object.keys(targetValues),
  ];

  const missingPropertyNames = allProperties.filter(
    (propertyName) =>
      !Object.keys(currentValues).includes(propertyName) ||
      !Object.keys(targetValues).includes(propertyName)
  );

  if (missingPropertyNames.length === 0) return;

  if (!override[name]) {
    override[name] = {};
  }

  if (!override[name][property]) {
    override[name][property] = {};
  }

  for (const missingName of missingPropertyNames) {
    override[name][property][missingName] = true;
  }
};

const diffBoolean = (current, override, target, name, property) => {
  const currentValue = current[name]?.[property] || undefined;
  const targetValue = target[name]?.[property] || undefined;

  if (currentValue == targetValue) return;

  if (!override[name]) {
    override[name] = {};
  }

  override[name][property] = true;
};

const currentFile = process.argv[2];
const overrideFile = process.argv[3];
const targetFile = process.argv[4];

const current = JSON.parse(fs.readFileSync(currentFile));
const override = JSON.parse(fs.readFileSync(overrideFile));
const target = JSON.parse(fs.readFileSync(targetFile));

const allNames = [
  ...Object.keys(current.resources),
  ...Object.keys(target.resources),
];

for (const name of allNames) {
  diffMap(
    current.resources,
    override.resources,
    target.resources,
    name,
    "builtin"
  );

  diffMap(
    current.resources,
    override.resources,
    target.resources,
    name,
    "globals"
  );

  diffBoolean(
    current.resources,
    override.resources,
    target.resources,
    name,
    "native"
  );

  diffMap(
    current.resources,
    override.resources,
    target.resources,
    name,
    "packages"
  );
}

fs.writeFileSync(overrideFile, JSON.stringify(override, undefined, 2) + "\n");
