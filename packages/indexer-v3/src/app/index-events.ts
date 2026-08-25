import { defaultLogger } from '@subsquid/pipes';
import { metricsServer } from '@subsquid/pipes/metrics/node';
import { loadRuntimeConfig } from '../config/index.js';
import {
  createNetworkDatabase,
  createNetworkPool,
  loadNetworkDatabaseConfig,
} from '../db/index.js';
import { runEventIngestion } from '../events/index.js';
import {
  createIndexerDatabaseMetricsReader,
  registerIndexerDatabaseMetrics,
  runNetworkProgram,
  type NetworkProgramContext,
} from '../runtime/index.js';

async function indexEvents(context: NetworkProgramContext): Promise<void> {
  const databaseConfig = loadNetworkDatabaseConfig(context.runtime);
  const pool = createNetworkPool(databaseConfig);
  try {
    const db = createNetworkDatabase(pool);
    if (context.metrics != null) {
      registerIndexerDatabaseMetrics(
        context.metrics.metrics,
        context.runtime,
        createIndexerDatabaseMetricsReader(db, context.runtime),
      );
    }
    await runEventIngestion({
      runtime: context.runtime,
      databaseConfig,
      db,
      rpc: context.rpc,
      ...(context.logger == null ? {} : { logger: context.logger }),
      ...(context.metrics == null ? {} : { metrics: context.metrics }),
    });
  } finally {
    await pool.end();
  }
}

async function main(): Promise<void> {
  const runtime = loadRuntimeConfig();
  const logger = defaultLogger({ id: `indexer:${runtime.network.key}` });
  const server = metricsServer({ port: runtime.metricsPort, logger });
  try {
    await runNetworkProgram(
      async (context): Promise<void> => {
        server.start();
        await indexEvents(context);
      },
      { logger, metrics: server },
    );
  } finally {
    await server.stop();
  }
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
