import { runNetworkProgram, type NetworkProgramContext } from '../runtime/index.js';
import { runRuntimeProbe } from '../source/index.js';

async function probeNetwork(context: NetworkProgramContext): Promise<void> {
  const summary = await runRuntimeProbe(context);
  console.info(JSON.stringify(summary, null, 2));
}

async function main(): Promise<void> {
  await runNetworkProgram(probeNetwork);
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
