const linesWithExplicitTSImport =
  /^import\s+(?:(?:\*|[\w-]+)\s+as\s+[\w-]+|(?:\{(?:\s*(?:\*|[\w-]+)\s*(?:,\s*(?:\*|[\w-]+)\s*)*)?\})\s+from\s+['"](?:(?:\.{1,2}\/)+)?([\w/-]+\.ts)['"];?)$/gmu;

const linesWithPartialExplicitTSImport =
  /^(?:\}\s+from\s+['"])(?:(?:\.{1,2}\/)+)?([\w/-]+\.ts)(?:['"];)?$/gmu;

function replaceTSExtension(matchedLine, content) {
  const matchedLineContent = matchedLine[0];
  const matchedLineImport = matchedLine[1];
  const newMatchedLineContent = matchedLineContent.replace(
    matchedLineImport,
    `${matchedLineImport.replace(/\.ts$/gmu, '')}`,
  );

  return content.replace(matchedLineContent, newMatchedLineContent);
}

module.exports = function (babel) {
  return {
    visitor: {
      Program: (path, state) => {
        const filePath = state.file.opts.filename;
        const fileContent = state.file.code;

        if (/^\/\/# sourceMappingURL=/gmu.test(fileContent)) {
          return;
        }

        const matchedLines = [
          ...fileContent.matchAll(linesWithExplicitTSImport),
        ];

        const matchedPartialLines = [
          ...fileContent.matchAll(linesWithPartialExplicitTSImport),
        ];

        if (matchedLines.length === 0 && matchedPartialLines.length === 0) {
          return;
        }

        console.log('Explicit TS import found in file: ', filePath);

        const allMatches = [...matchedLines, ...matchedPartialLines];
        let newFileContent = fileContent;

        for (const matchedLine of allMatches) {
          newFileContent = replaceTSExtension(matchedLine, newFileContent);
        }

        const newNodes = babel.template.ast(newFileContent, {
          plugins: ['jsx', 'typescript'],
        });

        const body = path.get('body');

        for (let i = body.length - 1; i >= 0; i--) {
          path.get(`body.${i}`).remove();
        }

        path.pushContainer('body', newNodes);
      },
    },
  };
};
