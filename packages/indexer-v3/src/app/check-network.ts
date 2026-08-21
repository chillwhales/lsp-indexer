import { loadRuntimeConfig } from '../config/index.js';
import { verifyNetworkReadiness } from '../runtime/index.js';

async function main(): Promise<void> {
  const runtime = loadRuntimeConfig();
  const readiness = await verifyNetworkReadiness(runtime);
  console.info(JSON.stringify(readiness, null, 2));
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
