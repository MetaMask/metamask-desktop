import '../globals';

export const benchmark = async (
  iterations: number,
  test: (iterations: number, start: () => void) => void,
) => {
  let startTime = new Date().getTime();

  await test(iterations, () => {
    startTime = new Date().getTime();
  });

  const end = new Date().getTime();
  const duration = end - startTime;
  const average = duration / iterations;

  return { duration, average };
};

export const run = async (
  scenarios: {
    name: string;
    test: (iterations: number, start: () => void) => void;
  }[],
) => {
  const iterations = process.argv[2] ? parseInt(process.argv[2], 10) : 1000;
  const results: { [name: string]: any } = {};

  for (const scenario of scenarios) {
    console.log('Running scenario', { name: scenario.name });
    results[scenario.name] = await benchmark(iterations, scenario.test);
  }

  console.log(`\nResults - Iterations: ${iterations}`);
  console.table(results, ['duration', 'average']);
};
