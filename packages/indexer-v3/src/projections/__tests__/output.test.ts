import type { BatchContext, Transformer } from '@subsquid/pipes';
import { toHex } from 'viem';
import { describe, expect, it, vi } from 'vitest';
import { loadRuntimeConfig } from '../../config/index.js';
import type { NetworkDatabase } from '../../db/client.js';
import type { EventIngestionBatch } from '../../events/decode.js';
import type { NetworkRpcClient } from '../../rpc/index.js';
import { createProjectionOutput, type ProjectionBatch } from '../output.js';

function emptyFacts(): EventIngestionBatch {
  return { blocks: [], events: [], decodedEvents: 0, malformedEvents: 0 };
}

function fakeDatabase(): NetworkDatabase {
  const database = {
    select() {
      return {
        from() {
          return { where: (): Promise<[]> => Promise.resolve([]) };
        },
      };
    },
  };
  return database as unknown as NetworkDatabase;
}

function projectionTransform(
  rpc: NetworkRpcClient,
): Transformer<EventIngestionBatch, ProjectionBatch>['options']['transform'] {
  const runtime = loadRuntimeConfig({ INDEXER_NETWORK: 'lukso-mainnet' });
  const output = createProjectionOutput(runtime, rpc, fakeDatabase());
  const projection = output.children.at(-1);
  if (projection == null) throw new Error('Expected projection output stage');
  return projection.options.transform;
}

function context(
  current: number,
  latest: number,
  currentHash: string | null = toHex(BigInt(current), { size: 32 }),
): BatchContext {
  return {
    stream: {
      state: {
        current: {
          number: current,
          ...(currentHash == null ? {} : { hash: currentHash }),
        },
      },
      head: { latest: { number: latest } },
    },
  } as unknown as BatchContext;
}

describe('projection output orchestration', () => {
  it('skips product-extension polling while catching up', async () => {
    const multicall = vi.fn();
    const transform = projectionTransform({ multicall } as unknown as NetworkRpcClient);

    await expect(transform(emptyFacts(), context(9, 10))).resolves.toEqual({
      facts: emptyFacts(),
      verifications: [],
      claimStatusUpdates: [],
    });
    await expect(transform(emptyFacts(), context(9, 10, null))).resolves.toEqual({
      facts: emptyFacts(),
      verifications: [],
      claimStatusUpdates: [],
    });
    expect(multicall).not.toHaveBeenCalled();
  });

  it('checks unresolved extensions at the exact available head', async () => {
    const multicall = vi.fn();
    const transform = projectionTransform({ multicall } as unknown as NetworkRpcClient);

    await expect(transform(emptyFacts(), context(10, 10))).resolves.toEqual({
      facts: emptyFacts(),
      verifications: [],
      claimStatusUpdates: [],
    });
    expect(multicall).not.toHaveBeenCalled();
  });

  it('rejects an unhashable head before issuing non-reproducible reads', async () => {
    const transform = projectionTransform({ multicall: vi.fn() } as unknown as NetworkRpcClient);

    await expect(transform(emptyFacts(), context(10, 10, null))).rejects.toThrow(
      'Cannot pin product-extension reads without a current block hash',
    );
  });

  it('rejects a malformed current block hash before extension reads', async () => {
    const transform = projectionTransform({ multicall: vi.fn() } as unknown as NetworkRpcClient);

    await expect(transform(emptyFacts(), context(10, 10, '0x1234'))).rejects.toThrow(
      'current block hash must be a 0x-prefixed hexadecimal value of the expected length',
    );
  });
});
