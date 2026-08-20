import { describe, expect, it, vi } from 'vitest';
import { loadRuntimeConfig } from '../../config/index.js';
import type { RpcReadinessClient } from '../../rpc/index.js';
import { verifyNetworkReadiness } from '../readiness.js';

function createJsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('network readiness', () => {
  it('checks Portal and RPC before exposing network identity', async () => {
    const runtime = loadRuntimeConfig({ INDEXER_NETWORK: 'ethereum-mainnet' });
    const fetchImplementation = vi.fn(
      (): Promise<Response> =>
        Promise.resolve(
          createJsonResponse({
            dataset: 'ethereum-mainnet',
            aliases: [],
            real_time: true,
            start_block: 0,
          }),
        ),
    );
    const rpc: RpcReadinessClient = {
      getChainId(): Promise<number> {
        return Promise.resolve(1);
      },
      getCode(): Promise<`0x${string}` | undefined> {
        return Promise.resolve('0x01');
      },
    };

    await expect(verifyNetworkReadiness(runtime, { fetchImplementation, rpc })).resolves.toEqual({
      network: 'ethereum-mainnet',
      chainId: 1,
      streamId: 'lsp-indexer:v3:eip155:1',
      databaseSchema: 'chain_ethereum_mainnet',
      portal: { dataset: 'ethereum-mainnet', realTime: true, bounded: false },
      rpcChainId: 1,
      contracts: [
        {
          name: 'lsp23Factory',
          address: '0x2300000A84D25dF63081feAa37ba6b62C4c89a30',
          fromBlock: 20_217_894,
        },
        {
          name: 'lsp26FollowerSystem',
          address: '0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA',
          fromBlock: 25_505_856,
        },
      ],
    });
  });
});
