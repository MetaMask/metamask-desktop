module.exports = {
  readFile: () => {
    Promise.resolve(console.log('no fs/promises.readFile'));
  },
  writeFile: () => {
    Promise.resolve(console.log('no fs/promises.writeFile'));
  },
};
