var CodeFencing = require('../submodules/extension/development/build/transforms/remove-fenced-code.js');

module.exports = function (babel) {
  return {
    visitor: {
      Program: function (path, state) {
        var originalConsoleWarn = console.warn;
        console.warn = function () {};

        var buildType = state.opts.buildType || '';
        var filePath = state.file.opts.filename;
        var fileContent = state.file.code;

        var fencingResult = CodeFencing.removeFencedCode(
          filePath,
          buildType,
          fileContent
        );

        var newFileContent = fencingResult[0];
        var wasModified = fencingResult[1];

        if (!wasModified) {
          return;
        }

        var newNodes = babel.template.ast(newFileContent, {
          plugins: ['jsx', 'typescript'],
        });

        var body = path.get('body');

        for (var i = body.length - 1; i >= 0; i--) {
          path.get('body.' + i).remove();
        }

        path.pushContainer('body', newNodes);

        console.warn = originalConsoleWarn;
      },
    },
  };
};
