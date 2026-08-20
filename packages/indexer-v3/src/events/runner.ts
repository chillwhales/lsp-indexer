import type { RuntimeConfig } from '../config/index.js';
import type { NetworkDatabase } from '../db/client.js';
import type { NetworkDatabaseConfig } from '../db/config.js';
import { createPersistenceBatch } from '../db/target.js';
import { createNetworkStream, type NetworkStreamOptions } from '../source/stream.js';
import { createEventIngestionOutput } from './output.js';
import { createEventPersistenceTarget } from './persistence.js';

type EventIngestionOutput = ReturnType<typeof createEventIngestionOutput>;

export interface RunEventIngestionOptions {
  runtime: RuntimeConfig;
  databaseConfig: NetworkDatabaseConfig;
  db: NetworkDatabase;
  logger?: NetworkStreamOptions<EventIngestionOutput>['logger'];
  metrics?: NetworkStreamOptions<EventIngestionOutput>['metrics'];
}

/** Stream, decode, and atomically persist v2-parity raw events for one configured network. */
export async function runEventIngestion(options: RunEventIngestionOptions): Promise<void> {
  const stream = createNetworkStream({
    runtime: options.runtime,
    outputs: createEventIngestionOutput(options.runtime),
    ...(options.logger == null ? {} : { logger: options.logger }),
    ...(options.metrics == null ? {} : { metrics: options.metrics }),
  }).pipe((data, ctx) => createPersistenceBatch(options.runtime, data, ctx));

  const target = createEventPersistenceTarget({
    runtime: options.runtime,
    databaseConfig: options.databaseConfig,
    db: options.db,
  });

  await stream.pipeTo(target);
}
