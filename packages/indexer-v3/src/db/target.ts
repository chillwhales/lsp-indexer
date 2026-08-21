import type { BlockCursor, HookContext } from '@subsquid/pipes';
import { drizzleTarget, type Transaction } from '@subsquid/pipes/targets/drizzle/node-postgres';
import type { RuntimeConfig } from '../config/index.js';
import type { NetworkDatabase } from './client.js';
import { normalizeBytes32 } from './identity.js';
import { CURSOR_TABLE } from './names.js';
import { verifyDatabaseReadiness } from './readiness.js';
import { indexedHeads, rollbackTables } from './schema.js';

export interface PersistenceHead {
  network: string;
  chainId: number;
  blockNumber: number;
  blockHash: string;
  blockTimestamp: Date;
  finalizedBlockNumber?: number;
  finalizedBlockHash?: string;
}

export interface PersistenceBatch<T> {
  payload: T;
  head: PersistenceHead;
}

export interface PersistenceSourceContext {
  stream: {
    state: { current: BlockCursor };
    head: { finalized?: BlockCursor };
  };
}

export interface PersistenceHandlerContext {
  tx: Transaction;
  ctx: HookContext;
}

export interface PersistenceTargetOptions<T> {
  runtime: RuntimeConfig;
  db: NetworkDatabase;
  onData(context: PersistenceHandlerContext, payload: T): Promise<unknown>;
  unfinalizedBlocksRetention?: number;
}

function validateHead(runtime: RuntimeConfig, head: PersistenceHead): void {
  if (head.network !== runtime.network.key || head.chainId !== runtime.network.chainId) {
    throw new Error('Persistence head does not match the target network');
  }
  if (!Number.isSafeInteger(head.blockNumber) || head.blockNumber < 0) {
    throw new Error('Persistence block number must be a non-negative safe integer');
  }
  normalizeBytes32(head.blockHash, 'persistence block hash');
  if (Number.isNaN(head.blockTimestamp.getTime())) {
    throw new Error('Persistence block timestamp must be a valid date');
  }

  const hasFinalizedNumber = head.finalizedBlockNumber != null;
  const hasFinalizedHash = head.finalizedBlockHash != null;
  if (hasFinalizedNumber !== hasFinalizedHash) {
    throw new Error('Finalized block number and hash must be provided together');
  }
  if (head.finalizedBlockNumber != null) {
    if (
      !Number.isSafeInteger(head.finalizedBlockNumber) ||
      head.finalizedBlockNumber < 0 ||
      head.finalizedBlockNumber > head.blockNumber
    ) {
      throw new Error('Finalized block number must be between zero and the current block');
    }
    normalizeBytes32(head.finalizedBlockHash ?? '', 'finalized block hash');
  }
}

/** Attach canonical Pipes batch provenance before entering the database transaction. */
export function createPersistenceBatch<T>(
  runtime: RuntimeConfig,
  payload: T,
  ctx: PersistenceSourceContext,
): PersistenceBatch<T> {
  const current = ctx.stream.state.current;
  if (current.hash == null || current.timestamp == null) {
    throw new Error('Persistence requires block hash and timestamp fields from the source');
  }
  if (!Number.isSafeInteger(current.timestamp) || current.timestamp < 0) {
    throw new Error('Persistence block timestamp must be a non-negative safe integer');
  }
  const finalized = ctx.stream.head.finalized;
  const head: PersistenceHead = {
    network: runtime.network.key,
    chainId: runtime.network.chainId,
    blockNumber: current.number,
    blockHash: current.hash,
    blockTimestamp: new Date(current.timestamp * 1_000),
    ...(finalized?.hash == null
      ? {}
      : {
          finalizedBlockNumber: finalized.number,
          finalizedBlockHash: finalized.hash,
        }),
  };
  validateHead(runtime, head);
  return { payload, head };
}

async function writeIndexedHead(
  tx: Transaction,
  runtime: RuntimeConfig,
  head: PersistenceHead,
): Promise<void> {
  validateHead(runtime, head);
  const finalizedValues =
    head.finalizedBlockNumber == null || head.finalizedBlockHash == null
      ? undefined
      : {
          finalizedBlockNumber: head.finalizedBlockNumber,
          finalizedBlockHash: head.finalizedBlockHash.toLowerCase(),
        };
  const values = {
    network: head.network,
    chainId: head.chainId,
    blockNumber: head.blockNumber,
    blockHash: head.blockHash.toLowerCase(),
    blockTimestamp: head.blockTimestamp,
    finalizedBlockNumber: finalizedValues?.finalizedBlockNumber ?? null,
    finalizedBlockHash: finalizedValues?.finalizedBlockHash ?? null,
    updatedAt: new Date(),
  };
  await tx
    .insert(indexedHeads)
    .values(values)
    .onConflictDoUpdate({
      target: [indexedHeads.network, indexedHeads.chainId],
      set: {
        blockNumber: values.blockNumber,
        blockHash: values.blockHash,
        blockTimestamp: values.blockTimestamp,
        ...finalizedValues,
        updatedAt: values.updatedAt,
      },
    });
}

/** Wire the official Pipes target to every mutable v3 table and one network-scoped cursor. */
export function createPersistenceTarget<T>(
  options: PersistenceTargetOptions<T>,
): ReturnType<typeof drizzleTarget<PersistenceBatch<T>>> {
  return drizzleTarget<PersistenceBatch<T>>({
    db: options.db,
    tables: rollbackTables,
    settings: {
      state: {
        schema: options.runtime.databaseSchema,
        table: CURSOR_TABLE,
        id: options.runtime.streamId,
        unfinalizedBlocksRetention:
          options.unfinalizedBlocksRetention ??
          Math.max(1_000, options.runtime.network.finalityConfirmations * 4),
      },
      transaction: { isolationLevel: 'serializable' },
    },
    async onStart(): Promise<void> {
      await verifyDatabaseReadiness(options.db, options.runtime);
    },
    async onData({ tx, data, ctx }): Promise<void> {
      await options.onData({ tx, ctx }, data.payload);
      await writeIndexedHead(tx, options.runtime, data.head);
    },
  });
}
