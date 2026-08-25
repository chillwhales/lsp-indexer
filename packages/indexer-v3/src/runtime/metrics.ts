import type { MetricsServer } from '@subsquid/pipes';
import { and, desc, eq } from 'drizzle-orm';
import type { RuntimeConfig } from '../config/index.js';
import type { NetworkDatabase } from '../db/client.js';
import { indexedHeads, sqdCursor } from '../db/schema.js';

const SNAPSHOT_CACHE_MS = 1_000;

export interface IndexerDatabaseMetricsSnapshot {
  indexedBlock: number;
  finalizedBlock: number | null;
  cursorBlock: number;
  blockTimestamp: Date;
}

export interface IndexerDatabaseMetricsReader {
  read(): Promise<IndexerDatabaseMetricsSnapshot | null>;
}

function parseBlockNumber(value: bigint | number | string, name: string): number {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) {
    throw new Error(`${name} must be a non-negative safe integer`);
  }
  return number;
}

/** Read committed head and cursor state for the current network. */
export function createIndexerDatabaseMetricsReader(
  db: NetworkDatabase,
  runtime: RuntimeConfig,
): IndexerDatabaseMetricsReader {
  return {
    async read(): Promise<IndexerDatabaseMetricsSnapshot | null> {
      const [snapshot] = await db
        .select({
          blockNumber: indexedHeads.blockNumber,
          finalizedBlockNumber: indexedHeads.finalizedBlockNumber,
          blockTimestamp: indexedHeads.blockTimestamp,
          currentNumber: sqdCursor.currentNumber,
        })
        .from(indexedHeads)
        .innerJoin(sqdCursor, eq(sqdCursor.id, runtime.streamId))
        .where(
          and(
            eq(indexedHeads.network, runtime.network.key),
            eq(indexedHeads.chainId, runtime.network.chainId),
          ),
        )
        .orderBy(desc(sqdCursor.currentNumber))
        .limit(1);
      if (snapshot == null) return null;

      return {
        indexedBlock: parseBlockNumber(snapshot.blockNumber, 'indexed block'),
        finalizedBlock:
          snapshot.finalizedBlockNumber == null
            ? null
            : parseBlockNumber(snapshot.finalizedBlockNumber, 'finalized block'),
        cursorBlock: parseBlockNumber(snapshot.currentNumber, 'Pipes cursor block'),
        blockTimestamp: snapshot.blockTimestamp,
      };
    },
  };
}

/** Register pull-based metrics that reflect only committed PostgreSQL state. */
export function registerIndexerDatabaseMetrics(
  metrics: MetricsServer['metrics'],
  runtime: RuntimeConfig,
  reader: IndexerDatabaseMetricsReader,
  now: () => number = Date.now,
): void {
  const labels = {
    network: runtime.network.key,
    chain_id: String(runtime.network.chainId),
  };
  let cached:
    | {
        expiresAt: number;
        value: IndexerDatabaseMetricsSnapshot | null;
        available: boolean;
      }
    | undefined;
  let pending: Promise<NonNullable<typeof cached>> | undefined;

  async function loadSnapshot(): Promise<NonNullable<typeof cached>> {
    const currentTime = now();
    if (cached != null && cached.expiresAt > currentTime) return cached;
    if (pending != null) return pending;

    pending = reader
      .read()
      .then((value) => ({
        expiresAt: now() + SNAPSHOT_CACHE_MS,
        value,
        available: true,
      }))
      .catch(() => ({
        expiresAt: now() + SNAPSHOT_CACHE_MS,
        value: null,
        available: false,
      }))
      .then((value) => {
        cached = value;
        pending = undefined;
        return value;
      });
    return pending;
  }

  metrics.gauge<'network' | 'chain_id'>({
    name: 'lsp_indexer_database_up',
    help: 'Whether committed indexer state can be read from PostgreSQL',
    labelNames: ['network', 'chain_id'],
    async collect() {
      const snapshot = await loadSnapshot();
      this.set(labels, snapshot.available ? 1 : 0);
    },
  });

  function committedGauge(
    name: string,
    help: string,
    select: (snapshot: IndexerDatabaseMetricsSnapshot) => number | null,
  ): void {
    metrics.gauge<'network' | 'chain_id'>({
      name,
      help,
      labelNames: ['network', 'chain_id'],
      async collect() {
        this.reset?.();
        const snapshot = await loadSnapshot();
        if (!snapshot.available || snapshot.value == null) return;
        const value = select(snapshot.value);
        if (value != null) this.set(labels, value);
      },
    });
  }

  committedGauge(
    'lsp_indexer_indexed_block',
    'Highest block committed to the network schema',
    ({ indexedBlock }) => indexedBlock,
  );
  committedGauge(
    'lsp_indexer_finalized_block',
    'Highest finalized block recorded with committed indexer state',
    ({ finalizedBlock }) => finalizedBlock,
  );
  committedGauge(
    'lsp_indexer_cursor_block',
    'Pipes cursor block committed in the same PostgreSQL transaction',
    ({ cursorBlock }) => cursorBlock,
  );
  committedGauge(
    'lsp_indexer_block_to_commit_lag_seconds',
    'Wall-clock age of the latest committed block',
    ({ blockTimestamp }) => Math.max(0, (now() - blockTimestamp.getTime()) / 1_000),
  );
  committedGauge(
    'lsp_indexer_finality_depth_blocks',
    'Distance between the committed indexed head and finalized head',
    ({ indexedBlock, finalizedBlock }) =>
      finalizedBlock == null ? null : Math.max(0, indexedBlock - finalizedBlock),
  );
  committedGauge(
    'lsp_indexer_cursor_drift_blocks',
    'Absolute distance between the committed projection head and Pipes cursor',
    ({ indexedBlock, cursorBlock }) => Math.abs(indexedBlock - cursorBlock),
  );
}
