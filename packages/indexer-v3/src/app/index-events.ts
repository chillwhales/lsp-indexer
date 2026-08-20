import {
  createNetworkDatabase,
  createNetworkPool,
  loadNetworkDatabaseConfig,
} from '../db/index.js';
import { runEventIngestion } from '../events/index.js';
import { runNetworkProgram, type NetworkProgramContext } from '../runtime/index.js';

async function indexEvents(context: NetworkProgramContext): Promise<void> {
  const databaseConfig = loadNetworkDatabaseConfig(context.runtime);
  const pool = createNetworkPool(databaseConfig);
  try {
    await runEventIngestion({
      runtime: context.runtime,
      databaseConfig,
      db: createNetworkDatabase(pool),
      rpc: context.rpc,
      ...(context.logger == null ? {} : { logger: context.logger }),
      ...(context.metrics == null ? {} : { metrics: context.metrics }),
    });
  } finally {
    await pool.end();
  }
}

async function main(): Promise<void> {
  await runNetworkProgram(indexEvents);
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
