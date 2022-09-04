module.exports = function (api) {
  api.cache(false);
  return {
    parserOpts: {
      strictMode: true,
    },
    targets: {
      electron: "20",
    },
    presets: [
      '@babel/preset-typescript',
      '@babel/preset-env',
    ]
  };
};
