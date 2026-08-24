import { describe, expect, it } from 'vitest';
import { loadRuntimeConfig } from '../../config/index.js';
import { createPersistenceBatch } from '../target.js';

const blockHash = `0x${'12'.repeat(32)}`;
const finalizedHash = `0x${'34'.repeat(32)}`;
const blockTimestamp = 1_700_000_000_123;

describe('persistence batch provenance', () => {
  it('attaches current and finalized Pipes cursors to a payload', () => {
    const runtime = loadRuntimeConfig({ INDEXER_NETWORK: 'ethereum-mainnet' });
    const batch = createPersistenceBatch(
      runtime,
      { facts: 2 },
      {
        stream: {
          state: { current: { number: 10, hash: blockHash, timestamp: blockTimestamp } },
          head: { finalized: { number: 8, hash: finalizedHash } },
        },
      },
    );

    expect(batch.payload).toEqual({ facts: 2 });
    expect(batch.head).toEqual({
      network: 'ethereum-mainnet',
      chainId: 1,
      blockNumber: 10,
      blockHash,
      blockTimestamp: new Date(blockTimestamp),
      finalizedBlockNumber: 8,
      finalizedBlockHash: finalizedHash,
    });
  });

  it('allows a source without a finalized watermark', () => {
    const runtime = loadRuntimeConfig({ INDEXER_NETWORK: 'lukso-mainnet' });
    expect(
      createPersistenceBatch(runtime, 'payload', {
        stream: {
          state: { current: { number: 1, hash: blockHash, timestamp: 1 } },
          head: {},
        },
      }).head,
    ).not.toHaveProperty('finalizedBlockNumber');
  });

  it('clamps source finality ahead of a backfill cursor to the processed block', () => {
    const runtime = loadRuntimeConfig({ INDEXER_NETWORK: 'ethereum-mainnet' });
    const batch = createPersistenceBatch(runtime, 'payload', {
      stream: {
        state: { current: { number: 10, hash: blockHash, timestamp: blockTimestamp } },
        head: { finalized: { number: 20, hash: finalizedHash } },
      },
    });

    expect(batch.head).toMatchObject({
      blockNumber: 10,
      blockHash,
      finalizedBlockNumber: 10,
      finalizedBlockHash: blockHash,
    });
  });

  it('rejects a source query that omitted required block provenance', () => {
    const runtime = loadRuntimeConfig({ INDEXER_NETWORK: 'ethereum-mainnet' });
    expect(() =>
      createPersistenceBatch(runtime, 'payload', {
        stream: { state: { current: { number: 1 } }, head: {} },
      }),
    ).toThrow('block hash and timestamp');
  });

  it('rejects an invalid source timestamp', () => {
    const runtime = loadRuntimeConfig({ INDEXER_NETWORK: 'ethereum-mainnet' });
    expect(() =>
      createPersistenceBatch(runtime, 'payload', {
        stream: {
          state: { current: { number: 1, hash: blockHash, timestamp: Number.NaN } },
          head: {},
        },
      }),
    ).toThrow('non-negative safe integer');
  });
});
