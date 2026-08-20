import {
  mockBlock,
  mockEvmPortalStream,
  resetMockBlockCounter,
  type MockPortal,
} from '@subsquid/pipes/testing/evm';
import { beforeEach, describe, expect, it } from 'vitest';
import { loadRuntimeConfig, type RuntimeConfig } from '../../config/index.js';
import { assertRuntimeProbeCompleteness, runRuntimeProbe } from '../probe.js';

function createRuntime(
  network: string,
  portalUrl: string,
  from: number,
  to: number,
): RuntimeConfig {
  return {
    ...loadRuntimeConfig({
      INDEXER_NETWORK: network,
      INDEXER_FROM_BLOCK: String(from),
      INDEXER_TO_BLOCK: String(to),
    }),
    portalUrl,
  };
}

async function closePortals(portals: readonly MockPortal[]): Promise<void> {
  await Promise.all(
    portals.map(async (portal) => {
      await portal.close();
    }),
  );
}

describe('runtime source probe', () => {
  beforeEach(() => {
    resetMockBlockCounter();
  });

  it('backfills two networks concurrently without identity collisions', async () => {
    const firstPortal = await mockEvmPortalStream({
      blocks: [
        mockBlock({
          number: 100,
          transactions: [
            {
              logs: [
                {
                  address: '0x0000000000000000000000000000000000000001',
                  topics: ['0x01'],
                  data: '0x02',
                },
              ],
            },
          ],
        }),
        mockBlock({ number: 101 }),
      ],
    });
    const secondPortal = await mockEvmPortalStream({
      blocks: [mockBlock({ number: 500 })],
    });

    try {
      const [mainnet, sepolia] = await Promise.all([
        runRuntimeProbe({
          runtime: createRuntime('ethereum-mainnet', firstPortal.url, 100, 101),
          logger: 'error',
        }),
        runRuntimeProbe({
          runtime: createRuntime('ethereum-sepolia', secondPortal.url, 500, 500),
          logger: 'error',
        }),
      ]);

      expect(mainnet).toMatchObject({
        network: 'ethereum-mainnet',
        chainId: 1,
        streamId: 'lsp-indexer:v3:eip155:1',
        firstBlock: 100,
        lastBlock: 101,
        batches: 1,
        blocks: 2,
        logs: 1,
      });
      expect(sepolia).toMatchObject({
        network: 'ethereum-sepolia',
        chainId: 11_155_111,
        streamId: 'lsp-indexer:v3:eip155:11155111',
        firstBlock: 500,
        lastBlock: 500,
        batches: 1,
        blocks: 1,
        logs: 0,
      });
      expect(mainnet.streamId).not.toBe(sepolia.streamId);
      expect(mainnet.complete).toBe(true);
      expect(sepolia.complete).toBe(true);
    } finally {
      await closePortals([firstPortal, secondPortal]);
    }
  });

  it('refuses an unbounded diagnostic scan', async () => {
    const runtime = loadRuntimeConfig({ INDEXER_NETWORK: 'ethereum-mainnet' });

    await expect(runRuntimeProbe({ runtime, logger: 'error' })).rejects.toThrow(
      'requires INDEXER_TO_BLOCK',
    );
  });

  it('fails when a source result does not contain both requested boundaries', () => {
    expect(() => {
      assertRuntimeProbeCompleteness(10, 11, 10, 10);
    }).toThrow('incomplete range: expected 10-11, received 10-10');
    expect(() => {
      assertRuntimeProbeCompleteness(10, 11, null, null);
    }).toThrow('incomplete range: expected 10-11, received none-none');
  });
});
