import { describe, expect, it } from 'vitest';
import { blocks, eventFacts } from '../../db/schema.js';
import type { PersistenceHandlerContext } from '../../db/target.js';
import type { EventIngestionBatch } from '../decode.js';
import { persistEventBatch } from '../persistence.js';

type StoredRecord = Record<string, unknown> & { id: string };

interface FakeTransactionState {
  blocks: Map<string, StoredRecord>;
  events: Map<string, StoredRecord>;
  insertSizes: { blocks: number[]; events: number[] };
  skippedIds: Set<string>;
}

function isStoredRecord(value: unknown): value is StoredRecord {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    'id' in value &&
    typeof value.id === 'string'
  );
}

function readRecords(value: unknown): StoredRecord[] {
  if (!Array.isArray(value) || !value.every(isStoredRecord)) {
    throw new Error('Fake transaction expected records with string IDs');
  }
  return value;
}

function createFakeTransaction(skippedIds: readonly string[] = []): {
  tx: PersistenceHandlerContext['tx'];
  state: FakeTransactionState;
} {
  const state: FakeTransactionState = {
    blocks: new Map(),
    events: new Map(),
    insertSizes: { blocks: [], events: [] },
    skippedIds: new Set(skippedIds),
  };

  function resolveStore(table: unknown): {
    records: Map<string, StoredRecord>;
    insertSizes: number[];
  } {
    if (table === blocks) {
      return { records: state.blocks, insertSizes: state.insertSizes.blocks };
    }
    if (table === eventFacts) {
      return { records: state.events, insertSizes: state.insertSizes.events };
    }
    throw new Error('Unexpected table in fake transaction');
  }

  const fakeTransaction = {
    insert(table: unknown) {
      const store = resolveStore(table);
      return {
        values(value: unknown) {
          const records = readRecords(value);
          store.insertSizes.push(records.length);
          return {
            onConflictDoNothing() {
              return {
                returning(): Promise<{ id: string }[]> {
                  const inserted: { id: string }[] = [];
                  for (const record of records) {
                    if (state.skippedIds.has(record.id) || store.records.has(record.id)) continue;
                    store.records.set(record.id, record);
                    inserted.push({ id: record.id });
                  }
                  return Promise.resolve(inserted);
                },
              };
            },
          };
        },
      };
    },
    select() {
      return {
        from(table: unknown) {
          const store = resolveStore(table);
          return {
            where(): Promise<StoredRecord[]> {
              return Promise.resolve([...store.records.values()]);
            },
          };
        },
      };
    },
  };

  // Drizzle's transaction surface is intentionally replaced by a narrow in-memory test double.
  const tx = fakeTransaction as unknown as PersistenceHandlerContext['tx'];
  return { tx, state };
}

function createBatch(position = 0): EventIngestionBatch {
  const suffix = position.toString(16).padStart(64, '0');
  const blockHash = `0x${suffix}`;
  const parentHash = `0x${(position + 1).toString(16).padStart(64, '0')}`;
  const transactionHash = `0x${(position + 2).toString(16).padStart(64, '0')}`;
  const id = `eip155:42:log:${position}:0:0`;
  return {
    blocks: [
      {
        id: `eip155:42:block:${position}`,
        network: 'lukso-mainnet',
        chainId: 42,
        number: position,
        hash: blockHash,
        parentHash,
        timestamp: new Date((1_700_000_000 + position) * 1_000),
      },
    ],
    events: [
      {
        id,
        network: 'lukso-mainnet',
        chainId: 42,
        blockNumber: position,
        blockHash,
        parentHash,
        blockTimestamp: new Date((1_700_000_000 + position) * 1_000),
        transactionHash,
        transactionIndex: 0,
        logIndex: 0,
        address: '0x0000000000000000000000000000000000000001',
        topic0: `0x${'ab'.repeat(32)}`,
        topics: [`0x${'ab'.repeat(32)}`],
        data: '0x',
        eventName: 'DataChanged',
        eventDomain: 'erc725y',
        decoded: { dataKey: `0x${'cd'.repeat(32)}`, dataValue: '0x' },
      },
    ],
    decodedEvents: 1,
    malformedEvents: 0,
  };
}

describe('event persistence writer', () => {
  it('handles an empty batch without issuing database writes', async () => {
    const { tx, state } = createFakeTransaction();
    const result = await persistEventBatch(
      { tx },
      { blocks: [], events: [], decodedEvents: 0, malformedEvents: 0 },
    );
    expect(state.insertSizes).toEqual({ blocks: [], events: [] });
    expect(result.insertedEventIds).toEqual(new Set());
  });

  it('inserts new records and accepts only an equivalent replay', async () => {
    const { tx, state } = createFakeTransaction();
    const batch = createBatch();
    const first = await persistEventBatch({ tx }, batch);
    const replay = await persistEventBatch({ tx }, batch);

    expect(state.blocks).toHaveLength(1);
    expect(state.events).toHaveLength(1);
    expect(state.insertSizes).toEqual({ blocks: [1, 1], events: [1, 1] });
    expect(first.insertedEventIds).toEqual(new Set([batch.events[0]?.id]));
    expect(replay.insertedEventIds).toEqual(new Set());
  });

  it('rejects a conflicting persisted block', async () => {
    const { tx } = createFakeTransaction();
    const batch = createBatch();
    await persistEventBatch({ tx }, batch);
    const conflicting = createBatch();
    const block = conflicting.blocks[0];
    if (block == null) throw new Error('Expected block fixture');
    block.hash = `0x${'ff'.repeat(32)}`;

    await expect(persistEventBatch({ tx }, conflicting)).rejects.toThrow(
      'Conflicting persisted block for deterministic ID eip155:42:block:0',
    );
  });

  it('rejects a conflicting or missing persisted event', async () => {
    const initial = createBatch();
    const eventId = initial.events[0]?.id;
    if (eventId == null) throw new Error('Expected event fixture');

    const first = createFakeTransaction();
    await persistEventBatch({ tx: first.tx }, initial);
    const conflicting = createBatch();
    const event = conflicting.events[0];
    if (event == null) throw new Error('Expected event fixture');
    event.decoded = { dataKey: `0x${'ef'.repeat(32)}`, dataValue: '0x' };
    await expect(persistEventBatch({ tx: first.tx }, conflicting)).rejects.toThrow(
      `Conflicting persisted event for deterministic ID ${eventId}`,
    );

    const missing = createFakeTransaction([eventId]);
    await expect(persistEventBatch({ tx: missing.tx }, initial)).rejects.toThrow(
      `Conflicting persisted event for deterministic ID ${eventId}`,
    );
  });

  it('chunks large inserts below the PostgreSQL parameter limit', async () => {
    const { tx, state } = createFakeTransaction();
    const batches = Array.from({ length: 1_001 }, (_, index) => createBatch(index));
    const batch: EventIngestionBatch = {
      blocks: batches.flatMap(({ blocks }) => blocks),
      events: batches.flatMap(({ events }) => events),
      decodedEvents: 1_001,
      malformedEvents: 0,
    };
    await persistEventBatch({ tx }, batch);

    expect(state.insertSizes).toEqual({ blocks: [1_000, 1], events: [1_000, 1] });
  });
});
