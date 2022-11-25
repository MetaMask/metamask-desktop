const CodeFencing = require('../submodules/extension/development/build/transforms/remove-fenced-code');

module.exports = function (babel) {
  return {
    visitor: {
      Program: (path, state) => {
        const originalConsoleWarn = console.warn;
        // eslint-disable-next-line no-empty-function
        console.warn = () => {};

        const buildType = state.opts.buildType || '';
        const filePath = state.file.opts.filename;
        const fileContent = state.file.code;

        const fencingResult = CodeFencing.removeFencedCode(
          filePath,
          buildType,
          fileContent,
        );

        const newFileContent = fencingResult[0];
        const wasModified = fencingResult[1];

        if (!wasModified) {
          return;
        }

        const newNodes = babel.template.ast(newFileContent, {
          plugins: ['jsx', 'typescript'],
        });

        const body = path.get('body');

        for (let i = body.length - 1; i >= 0; i--) {
          path.get(`body.${i}`).remove();
        }

        path.pushContainer('body', newNodes);

        console.warn = originalConsoleWarn;
      },
    },
  };
};
