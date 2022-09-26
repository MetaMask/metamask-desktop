import '../globals';

const DEFAULT_ITERATIONS = 10000;

const benchmark = async (
  name: string,
  iterations: number,
  test: (iterations: number, start: () => void) => void,
) => {
  let startTime = new Date().getTime();

  await test(iterations, () => {
    startTime = new Date().getTime();
  });

  const end = new Date().getTime();
  const total = end - startTime;
  const average = total / iterations;

  return { name, total, average };
};

export const run = async (
  scenarios: {
    name: string;
    test: (iterations: number, start: () => void) => void;
  }[],
) => {
  const iterations = process.argv[2]
    ? parseInt(process.argv[2], 10)
    : DEFAULT_ITERATIONS;

  const results = [];

  for (const scenario of scenarios) {
    console.log('Running scenario', { name: scenario.name });

    const result = await benchmark(scenario.name, iterations, scenario.test);
    results.push(result);
  }

  results.sort((a, b) => a.average - b.average);

  console.log(`\nIterations: ${iterations}`);
  console.table(results, ['name', 'total', 'average']);
};
