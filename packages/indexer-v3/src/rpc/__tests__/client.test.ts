import type { Hex } from 'viem';
import { describe, expect, it } from 'vitest';
import { loadRuntimeConfig } from '../../config/index.js';
import {
  assertConfiguredContracts,
  assertRpcChain,
  createNetworkRpcClient,
  type RpcChainReader,
  type RpcReadinessClient,
} from '../client.js';

function createReadinessRpc(chainId: number, code: Hex | undefined): RpcReadinessClient {
  return {
    getChainId(): Promise<number> {
      return Promise.resolve(chainId);
    },
    getCode(): Promise<Hex | undefined> {
      return Promise.resolve(code);
    },
  };
}

describe('network RPC client', () => {
  it('creates a client bound to the configured chain', () => {
    const runtime = loadRuntimeConfig({ INDEXER_NETWORK: 'ethereum-sepolia' });
    const client = createNetworkRpcClient(runtime);

    expect(client.chain?.id).toBe(11_155_111);
    expect(client.chain?.name).toBe('Ethereum Sepolia');
  });

  it('accepts the configured chain ID', async () => {
    const runtime = loadRuntimeConfig({ INDEXER_NETWORK: 'lukso-mainnet' });
    const rpc: RpcChainReader = {
      getChainId(): Promise<number> {
        return Promise.resolve(42);
      },
    };

    await expect(assertRpcChain(rpc, runtime)).resolves.toBe(42);
  });

  it('rejects an endpoint on another chain', async () => {
    const runtime = loadRuntimeConfig({ INDEXER_NETWORK: 'lukso-mainnet' });
    const rpc: RpcChainReader = {
      getChainId(): Promise<number> {
        return Promise.resolve(1);
      },
    };

    await expect(assertRpcChain(rpc, runtime)).rejects.toThrow(
      'RPC chain mismatch: expected 42, received 1',
    );
  });

  it('verifies every configured contract and skips absent capabilities', async () => {
    const lukso = loadRuntimeConfig({ INDEXER_NETWORK: 'lukso-mainnet' });
    const sepolia = loadRuntimeConfig({ INDEXER_NETWORK: 'ethereum-sepolia' });

    await expect(
      assertConfiguredContracts(createReadinessRpc(42, '0x01'), lukso),
    ).resolves.toHaveLength(2);
    await expect(
      assertConfiguredContracts(createReadinessRpc(11_155_111, '0x01'), sepolia),
    ).resolves.toEqual([
      {
        name: 'lsp23Factory',
        address: '0x2300000A84D25dF63081feAa37ba6b62C4c89a30',
        fromBlock: 0,
      },
    ]);
  });

  it('rejects a configured contract with no deployed code', async () => {
    const runtime = loadRuntimeConfig({ INDEXER_NETWORK: 'ethereum-mainnet' });

    await expect(
      assertConfiguredContracts(createReadinessRpc(1, undefined), runtime),
    ).rejects.toThrow('has no code on ethereum-mainnet');
  });
});
