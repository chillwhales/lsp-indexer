import { toHex } from 'viem';
import { describe, expect, it, vi } from 'vitest';
import { loadRuntimeConfig } from '../../config/index.js';
import type { NetworkRpcClient } from '../../rpc/index.js';
import { MAX_MULTICALL_BATCH_SIZE } from '../batching.js';
import {
  createProjectionCallExecutor,
  resolveProjectionVerifications,
  type ProjectionCallExecutor,
} from '../rpc.js';
import { INTERFACE_IDS } from '../standards.js';

const profile = '0x0000000000000000000000000000000000000010';
const asset = '0x0000000000000000000000000000000000000020';

describe('block-pinned projection RPC reads', () => {
  it('groups candidates by exact block and classifies standards without treating call failures as valid', async () => {
    const seen: { blockNumber: number; calls: number }[] = [];
    const execute: ProjectionCallExecutor = (blockNumber, calls) => {
      seen.push({ blockNumber, calls: calls.length });
      return Promise.resolve(
        calls.map((call) => {
          if (call.address === profile) {
            return { status: 'success' as const, value: true };
          }
          if (blockNumber === 10 && call.functionName === 'decimals') {
            return { status: 'success' as const, value: 18n };
          }
          if (
            blockNumber === 10 &&
            call.functionName === 'supportsInterface' &&
            call.interfaceId === INTERFACE_IDS.lsp7[0]
          ) {
            return { status: 'success' as const, value: true };
          }
          return { status: 'failure' as const };
        }),
      );
    };

    const result = await resolveProjectionVerifications(
      [
        { blockNumber: 10, address: profile, category: 'universalProfile' },
        { blockNumber: 10, address: asset, category: 'digitalAsset' },
        { blockNumber: 11, address: asset, category: 'digitalAsset' },
      ],
      execute,
    );

    expect(seen).toEqual([
      { blockNumber: 10, calls: 8 },
      { blockNumber: 11, calls: 7 },
    ]);
    expect(result).toEqual([
      {
        blockNumber: 10,
        address: profile,
        category: 'universalProfile',
        status: 'verified',
        standard: null,
        decimals: null,
      },
      {
        blockNumber: 10,
        address: asset,
        category: 'digitalAsset',
        status: 'verified',
        standard: 'lsp7',
        decimals: 18,
      },
      {
        blockNumber: 11,
        address: asset,
        category: 'digitalAsset',
        status: 'invalid',
        standard: null,
        decimals: null,
      },
    ]);
  });

  it('passes the exact block and configured Multicall3 address to viem', async () => {
    const multicall = vi.fn().mockResolvedValue([{ status: 'success', result: true }]);
    const runtime = loadRuntimeConfig({ INDEXER_NETWORK: 'lukso-mainnet' });
    const rpc = { multicall } as unknown as NetworkRpcClient;
    const execute = createProjectionCallExecutor(rpc, runtime);

    await execute(123, [
      { address: profile, functionName: 'supportsInterface', interfaceId: INTERFACE_IDS.lsp0 },
    ]);

    expect(multicall).toHaveBeenCalledWith(
      expect.objectContaining({
        blockNumber: 123n,
        multicallAddress: runtime.network.multicallAddress,
        allowFailure: true,
      }),
    );
  });

  it('rejects incomplete multicall responses so the cursor can retry', async () => {
    await expect(
      resolveProjectionVerifications(
        [{ blockNumber: 10, address: profile, category: 'universalProfile' }],
        (): Promise<[]> => Promise.resolve([]),
      ),
    ).rejects.toThrow('returned 0 results for 1 calls');
  });

  it('bounds large exact-block plans without changing candidate order', async () => {
    const batchSizes: number[] = [];
    const candidates = Array.from({ length: 72 }, (_, index) => ({
      blockNumber: 10,
      address: toHex(BigInt(index + 1), { size: 20 }),
      category: 'digitalAsset' as const,
    }));
    const execute: ProjectionCallExecutor = (_blockNumber, calls) => {
      batchSizes.push(calls.length);
      return Promise.resolve(calls.map(() => ({ status: 'failure' as const })));
    };

    const result = await resolveProjectionVerifications(candidates, execute);

    expect(batchSizes).toEqual([MAX_MULTICALL_BATCH_SIZE, 4]);
    expect(result).toHaveLength(candidates.length);
    expect(result.map(({ address }) => address)).toEqual(candidates.map(({ address }) => address));
  });
});
