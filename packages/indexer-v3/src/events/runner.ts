import type { RuntimeConfig } from '../config/index.js';
import type { NetworkDatabase } from '../db/client.js';
import type { NetworkDatabaseConfig } from '../db/config.js';
import { createPersistenceBatch } from '../db/target.js';
import { createProjectionOutput } from '../projections/output.js';
import { createProjectionPersistenceTarget } from '../projections/persistence.js';
import type { NetworkRpcClient } from '../rpc/index.js';
import { createNetworkStream, type NetworkStreamOptions } from '../source/stream.js';

type ProjectionOutput = ReturnType<typeof createProjectionOutput>;

export interface RunEventIngestionOptions {
  runtime: RuntimeConfig;
  databaseConfig: NetworkDatabaseConfig;
  db: NetworkDatabase;
  rpc: NetworkRpcClient;
  logger?: NetworkStreamOptions<ProjectionOutput>['logger'];
  metrics?: NetworkStreamOptions<ProjectionOutput>['metrics'];
}

/** Stream, decode, verify, and atomically persist facts and projections for one network. */
export async function runEventIngestion(options: RunEventIngestionOptions): Promise<void> {
  const stream = createNetworkStream({
    runtime: options.runtime,
    outputs: createProjectionOutput(options.runtime, options.rpc, options.db),
    ...(options.logger == null ? {} : { logger: options.logger }),
    ...(options.metrics == null ? {} : { metrics: options.metrics }),
  }).pipe((data, ctx) => createPersistenceBatch(options.runtime, data, ctx));

  const target = createProjectionPersistenceTarget({
    runtime: options.runtime,
    databaseConfig: options.databaseConfig,
    db: options.db,
  });

  await stream.pipeTo(target);
}
