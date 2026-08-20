import { defaultLogger } from '@subsquid/pipes';
import { metricsServer } from '@subsquid/pipes/metrics/node';
import { loadRuntimeConfig } from '../config/index.js';
import {
  createNetworkDatabase,
  createNetworkPool,
  loadNetworkDatabaseConfig,
  verifyDatabaseReadiness,
} from '../db/index.js';
import {
  loadMetadataWorkerConfig,
  registerMetadataMetrics,
  runMetadataWorker,
} from '../metadata/index.js';

async function main(): Promise<void> {
  const runtime = loadRuntimeConfig();
  const workerConfig = loadMetadataWorkerConfig(runtime);
  const databaseConfig = loadNetworkDatabaseConfig(runtime);
  const pool = createNetworkPool(databaseConfig);
  const db = createNetworkDatabase(pool);
  const server = metricsServer({ port: workerConfig.metricsPort });
  const logger = defaultLogger({ id: `metadata:${runtime.network.key}` });
  const abortController = new AbortController();
  const stop = (): void => abortController.abort();
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);

  try {
    await verifyDatabaseReadiness(db, runtime);
    server.start();
    logger.info(
      {
        component: 'metadata-worker',
        network: runtime.network.key,
        concurrency: workerConfig.concurrency,
        metricsPort: workerConfig.metricsPort,
      },
      'Metadata worker started',
    );
    await runMetadataWorker({
      db,
      runtime,
      config: workerConfig,
      metrics: registerMetadataMetrics(server.metrics),
      logger,
      signal: abortController.signal,
    });
  } finally {
    process.removeListener('SIGINT', stop);
    process.removeListener('SIGTERM', stop);
    await server.stop();
    await pool.end();
  }
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
