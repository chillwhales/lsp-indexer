import { inArray } from 'drizzle-orm';
import { isDeepStrictEqual } from 'node:util';
import type { RuntimeConfig } from '../config/index.js';
import type { NetworkDatabase } from '../db/client.js';
import type { NetworkDatabaseConfig } from '../db/config.js';
import { blocks, eventFacts } from '../db/schema.js';
import { createPersistenceTarget, type PersistenceHandlerContext } from '../db/target.js';
import type { EventIngestionBatch } from './decode.js';

const INSERT_CHUNK_SIZE = 1_000;

type BlockRow = typeof blocks.$inferSelect;
type EventFactRow = typeof eventFacts.$inferSelect;
type PersistenceTransaction = PersistenceHandlerContext['tx'];

export interface EventPersistenceTargetOptions {
  runtime: RuntimeConfig;
  databaseConfig: NetworkDatabaseConfig;
  db: NetworkDatabase;
}

function chunks<T>(values: readonly T[]): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += INSERT_CHUNK_SIZE) {
    result.push(values.slice(index, index + INSERT_CHUNK_SIZE));
  }
  return result;
}

function blockMatches(row: BlockRow, expected: EventIngestionBatch['blocks'][number]): boolean {
  return isDeepStrictEqual(row, expected);
}

function eventMatches(row: EventFactRow, expected: EventIngestionBatch['events'][number]): boolean {
  return isDeepStrictEqual(row, expected);
}

async function persistBlocks(
  tx: PersistenceTransaction,
  records: EventIngestionBatch['blocks'],
): Promise<void> {
  for (const chunk of chunks(records)) {
    const inserted = await tx
      .insert(blocks)
      .values(chunk)
      .onConflictDoNothing()
      .returning({ id: blocks.id });
    const insertedIds = new Set(inserted.map(({ id }) => id));
    const conflicts = chunk.filter(({ id }) => !insertedIds.has(id));
    if (conflicts.length === 0) continue;

    const rows = await tx
      .select()
      .from(blocks)
      .where(
        inArray(
          blocks.id,
          conflicts.map(({ id }) => id),
        ),
      );
    const rowsById = new Map(rows.map((row) => [row.id, row]));
    for (const expected of conflicts) {
      const row = rowsById.get(expected.id);
      if (row == null || !blockMatches(row, expected)) {
        throw new Error(`Conflicting persisted block for deterministic ID ${expected.id}`);
      }
    }
  }
}

async function persistEvents(
  tx: PersistenceTransaction,
  records: EventIngestionBatch['events'],
): Promise<Set<string>> {
  const insertedEventIds = new Set<string>();
  for (const chunk of chunks(records)) {
    const inserted = await tx
      .insert(eventFacts)
      .values(chunk)
      .onConflictDoNothing()
      .returning({ id: eventFacts.id });
    const insertedIds = new Set(inserted.map(({ id }) => id));
    for (const id of insertedIds) insertedEventIds.add(id);
    const conflicts = chunk.filter(({ id }) => !insertedIds.has(id));
    if (conflicts.length === 0) continue;

    const rows = await tx
      .select()
      .from(eventFacts)
      .where(
        inArray(
          eventFacts.id,
          conflicts.map(({ id }) => id),
        ),
      );
    const rowsById = new Map(rows.map((row) => [row.id, row]));
    for (const expected of conflicts) {
      const row = rowsById.get(expected.id);
      if (row == null || !eventMatches(row, expected)) {
        throw new Error(`Conflicting persisted event for deterministic ID ${expected.id}`);
      }
    }
  }
  return insertedEventIds;
}

export interface EventPersistenceResult {
  insertedEventIds: Set<string>;
}

/** Insert canonical raw blocks before their event facts inside the Pipes target transaction. */
export async function persistEventBatch(
  { tx }: Pick<PersistenceHandlerContext, 'tx'>,
  batch: EventIngestionBatch,
): Promise<EventPersistenceResult> {
  await persistBlocks(tx, batch.blocks);
  return { insertedEventIds: await persistEvents(tx, batch.events) };
}

/** Create the rollback-aware target used by raw event ingestion for one network schema. */
export function createEventPersistenceTarget(
  options: EventPersistenceTargetOptions,
): ReturnType<typeof createPersistenceTarget<EventIngestionBatch>> {
  return createPersistenceTarget<EventIngestionBatch>({
    runtime: options.runtime,
    databaseConfig: options.databaseConfig,
    db: options.db,
    onData: persistEventBatch,
  });
}
