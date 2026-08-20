import { toHex } from 'viem';
import { describe, expect, it } from 'vitest';
import type { PersistenceHandlerContext } from '../../db/target.js';
import { applyMetadataSourcePlan } from '../queue.js';
import type { MetadataSource, MetadataSourcePlan } from '../source.js';

interface FakeWriteState {
  updateBatches: number;
  insertSizes: number[];
}

function createFakeTransaction(): {
  tx: PersistenceHandlerContext['tx'];
  state: FakeWriteState;
} {
  const state: FakeWriteState = { updateBatches: 0, insertSizes: [] };
  const transaction = {
    update() {
      return {
        set() {
          return {
            where(): Promise<void> {
              state.updateBatches += 1;
              return Promise.resolve();
            },
          };
        },
      };
    },
    insert() {
      return {
        values(rows: unknown[]) {
          state.insertSizes.push(rows.length);
          return {
            onConflictDoUpdate(): Promise<void> {
              return Promise.resolve();
            },
          };
        },
      };
    },
  };
  // Drizzle's writer is replaced by the exact fluent methods used by source-plan persistence.
  return { tx: transaction as unknown as PersistenceHandlerContext['tx'], state };
}

function createSource(index: number): MetadataSource {
  const address = toHex(BigInt(index + 1), { size: 20 });
  return {
    id: `metadata-${index}`,
    network: 'ethereum-mainnet',
    chainId: 1,
    kind: 'lsp3_profile',
    address,
    tokenId: null,
    dataKey: toHex(1n, { size: 32 }),
    sourceRevision: toHex(BigInt(index + 1), { size: 32 }),
    contentUri: `ipfs://metadata-${index}`,
    contentHash: toHex(BigInt(index + 2), { size: 32 }),
    verificationMethod: '0x8019f9b1',
    lastBlockNumber: 100,
    lastBlockHash: toHex(100n, { size: 32 }),
    lastTransactionHash: toHex(200n, { size: 32 }),
    lastTransactionIndex: 0,
    lastLogIndex: index,
  };
}

describe('metadata source-plan persistence', () => {
  it('issues no writes for an empty projection plan', async () => {
    const { tx, state } = createFakeTransaction();
    await applyMetadataSourcePlan(tx, { scopes: [], sources: [], rejected: [] });
    expect(state).toEqual({ updateBatches: 0, insertSizes: [] });
  });

  it('chunks cancellation and upsert workloads without reordering sources', async () => {
    const { tx, state } = createFakeTransaction();
    const sources = Array.from({ length: 501 }, (_, index) => createSource(index));
    const plan: MetadataSourcePlan = {
      scopes: sources,
      sources,
      rejected: [],
    };
    await applyMetadataSourcePlan(tx, plan, new Date('2026-01-01T00:00:00Z'));

    expect(state.updateBatches).toBe(2);
    expect(state.insertSizes).toEqual([500, 1]);
  });

  it('cancels a rejected scope without trying to insert it', async () => {
    const { tx, state } = createFakeTransaction();
    const source = createSource(0);
    await applyMetadataSourcePlan(tx, {
      scopes: [source],
      sources: [],
      rejected: [{ scope: source, reason: 'Malformed source' }],
    });

    expect(state).toEqual({ updateBatches: 1, insertSizes: [] });
  });
});
