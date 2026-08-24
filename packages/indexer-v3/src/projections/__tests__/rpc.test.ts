import {
  encodeFunctionData,
  encodeFunctionResult,
  getAddress,
  multicall3Abi,
  RpcRequestError,
  toHex,
  type Hex,
} from 'viem';
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
const block10Hash = toHex(10n, { size: 32 });
const block11Hash = toHex(11n, { size: 32 });
const supportsInterfaceAbi = [
  {
    type: 'function',
    name: 'supportsInterface',
    stateMutability: 'view',
    inputs: [{ name: 'interfaceId', type: 'bytes4' }],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

function encodeMulticallResults(results: readonly { success: boolean; returnData: Hex }[]): Hex {
  return encodeFunctionResult({
    abi: multicall3Abi,
    functionName: 'aggregate3',
    result: results,
  });
}

function encodeSupportsInterface(interfaceId: Hex): Hex {
  return encodeFunctionData({
    abi: supportsInterfaceAbi,
    functionName: 'supportsInterface',
    args: [interfaceId],
  });
}

describe('block-pinned projection RPC reads', () => {
  it('groups candidates by exact block and classifies standards without treating call failures as valid', async () => {
    const seen: { blockNumber: number; blockHash: string; calls: number }[] = [];
    const execute: ProjectionCallExecutor = (block, calls) => {
      seen.push({ blockNumber: block.number, blockHash: block.hash, calls: calls.length });
      return Promise.resolve(
        calls.map((call) => {
          if (
            call.address === profile &&
            call.functionName === 'supportsInterface' &&
            call.interfaceId === INTERFACE_IDS.lsp0[1]
          ) {
            return { status: 'success' as const, value: true };
          }
          if (block.number === 10 && call.functionName === 'decimals') {
            return { status: 'success' as const, value: 18n };
          }
          if (
            block.number === 10 &&
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
        {
          blockNumber: 10,
          blockHash: block10Hash,
          address: profile,
          category: 'universalProfile',
        },
        {
          blockNumber: 10,
          blockHash: block10Hash,
          address: asset,
          category: 'digitalAsset',
        },
        {
          blockNumber: 11,
          blockHash: block11Hash,
          address: asset,
          category: 'digitalAsset',
        },
      ],
      execute,
    );

    expect(seen).toEqual([
      { blockNumber: 10, blockHash: block10Hash, calls: 9 },
      { blockNumber: 11, blockHash: block11Hash, calls: 7 },
    ]);
    expect(result).toEqual([
      {
        blockNumber: 10,
        blockHash: block10Hash,
        address: profile,
        category: 'universalProfile',
        status: 'verified',
        standard: null,
        decimals: null,
      },
      {
        blockNumber: 10,
        blockHash: block10Hash,
        address: asset,
        category: 'digitalAsset',
        status: 'verified',
        standard: 'lsp7',
        decimals: 18,
      },
      {
        blockNumber: 11,
        blockHash: block11Hash,
        address: asset,
        category: 'digitalAsset',
        status: 'invalid',
        standard: null,
        decimals: null,
      },
    ]);
  });

  it('binds Multicall3 to the exact Portal block hash through EIP-1898', async () => {
    const request = vi
      .fn()
      .mockResolvedValue(
        encodeMulticallResults([{ success: true, returnData: toHex(1n, { size: 32 }) }]),
      );
    const runtime = loadRuntimeConfig({ INDEXER_NETWORK: 'lukso-mainnet' });
    const blockNumber = runtime.network.multicall.fromBlock;
    const blockHash = toHex(BigInt(blockNumber), { size: 32 });
    const getBlock = vi.fn().mockResolvedValue({ hash: blockHash });
    const rpc = { getBlock, request } as unknown as NetworkRpcClient;
    const execute = createProjectionCallExecutor(rpc, runtime);

    await execute({ number: blockNumber, hash: blockHash }, [
      { address: profile, functionName: 'supportsInterface', interfaceId: INTERFACE_IDS.lsp0[0] },
    ]);

    const callData = encodeSupportsInterface(INTERFACE_IDS.lsp0[0]);
    expect(request).toHaveBeenCalledWith({
      method: 'eth_call',
      params: [
        {
          to: runtime.network.multicall.address,
          data: encodeFunctionData({
            abi: multicall3Abi,
            functionName: 'aggregate3',
            args: [[{ target: getAddress(profile), allowFailure: true, callData }]],
          }),
        },
        { blockHash, requireCanonical: true },
      ],
    });
    expect(getBlock).toHaveBeenCalledTimes(2);
  });

  it('uses bounded direct reads before Multicall3 is deployed', async () => {
    const runtime = loadRuntimeConfig({ INDEXER_NETWORK: 'lukso-mainnet' });
    const getBlock = vi.fn().mockResolvedValue({ hash: block10Hash });
    const request = vi.fn().mockResolvedValue(toHex(1n, { size: 32 }));
    const rpc = { getBlock, request } as unknown as NetworkRpcClient;
    const execute = createProjectionCallExecutor(rpc, runtime);

    await expect(
      execute({ number: 10, hash: block10Hash }, [
        {
          address: profile,
          functionName: 'supportsInterface',
          interfaceId: INTERFACE_IDS.lsp0[0],
        },
      ]),
    ).resolves.toEqual([{ status: 'success', value: true }]);

    expect(request).toHaveBeenCalledWith({
      method: 'eth_call',
      params: [
        { to: profile, data: encodeSupportsInterface(INTERFACE_IDS.lsp0[0]) },
        { blockHash: block10Hash, requireCanonical: true },
      ],
    });
    expect(getBlock).toHaveBeenCalledTimes(2);
  });

  it('isolates malformed direct return data but propagates direct transport failures', async () => {
    const runtime = loadRuntimeConfig({ INDEXER_NETWORK: 'lukso-mainnet' });
    const getBlock = vi.fn().mockResolvedValue({ hash: block10Hash });
    const rpc = {
      getBlock,
      request: vi
        .fn()
        .mockResolvedValueOnce('0x12')
        .mockRejectedValueOnce(
          new RpcRequestError({
            body: { method: 'eth_call' },
            error: { code: -32_000, message: 'execution reverted' },
            url: 'https://rpc.example',
          }),
        )
        .mockRejectedValueOnce(new Error('down')),
    } as unknown as NetworkRpcClient;
    const execute = createProjectionCallExecutor(rpc, runtime);
    const calls = [
      {
        address: profile,
        functionName: 'supportsInterface' as const,
        interfaceId: INTERFACE_IDS.lsp0[0],
      },
    ];

    await expect(execute({ number: 10, hash: block10Hash }, calls)).resolves.toEqual([
      { status: 'failure' },
    ]);
    await expect(execute({ number: 10, hash: block10Hash }, calls)).resolves.toEqual([
      { status: 'failure' },
    ]);
    await expect(execute({ number: 10, hash: block10Hash }, calls)).rejects.toThrow('down');
  });

  it('rejects reads when the RPC provider disagrees with the Portal block hash', async () => {
    const runtime = loadRuntimeConfig({ INDEXER_NETWORK: 'lukso-mainnet' });
    const rpc = {
      getBlock: vi.fn().mockResolvedValue({ hash: block11Hash }),
      request: vi.fn(),
    } as unknown as NetworkRpcClient;
    const execute = createProjectionCallExecutor(rpc, runtime);

    await expect(
      execute({ number: 10, hash: block10Hash }, [
        {
          address: profile,
          functionName: 'supportsInterface',
          interfaceId: INTERFACE_IDS.lsp0[0],
        },
      ]),
    ).rejects.toThrow('RPC block 10 hash mismatch');
    expect(rpc.request).not.toHaveBeenCalled();
  });

  it('rejects results when the RPC block changes while a multicall is in flight', async () => {
    const runtime = loadRuntimeConfig({ INDEXER_NETWORK: 'lukso-mainnet' });
    const blockNumber = runtime.network.multicall.fromBlock;
    const blockHash = toHex(BigInt(blockNumber), { size: 32 });
    const request = vi
      .fn()
      .mockResolvedValue(
        encodeMulticallResults([{ success: true, returnData: toHex(1n, { size: 32 }) }]),
      );
    const rpc = {
      getBlock: vi
        .fn()
        .mockResolvedValueOnce({ hash: blockHash })
        .mockResolvedValueOnce({ hash: block11Hash }),
      request,
    } as unknown as NetworkRpcClient;
    const execute = createProjectionCallExecutor(rpc, runtime);

    await expect(
      execute({ number: blockNumber, hash: blockHash }, [
        {
          address: profile,
          functionName: 'supportsInterface',
          interfaceId: INTERFACE_IDS.lsp0[0],
        },
      ]),
    ).rejects.toThrow(`RPC block ${blockNumber} changed during projection reads`);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('rejects incomplete Multicall3 aggregates before classifying candidates', async () => {
    const runtime = loadRuntimeConfig({ INDEXER_NETWORK: 'lukso-mainnet' });
    const blockNumber = runtime.network.multicall.fromBlock;
    const blockHash = toHex(BigInt(blockNumber), { size: 32 });
    const rpc = {
      getBlock: vi.fn().mockResolvedValue({ hash: blockHash }),
      request: vi.fn().mockResolvedValue(encodeMulticallResults([])),
    } as unknown as NetworkRpcClient;
    const execute = createProjectionCallExecutor(rpc, runtime);

    await expect(
      execute({ number: blockNumber, hash: blockHash }, [
        {
          address: profile,
          functionName: 'supportsInterface',
          interfaceId: INTERFACE_IDS.lsp0[0],
        },
      ]),
    ).rejects.toThrow(`Multicall3 returned 0 results for 1 calls at block ${blockNumber}`);
  });

  it('rejects incomplete multicall responses so the cursor can retry', async () => {
    await expect(
      resolveProjectionVerifications(
        [
          {
            blockNumber: 10,
            blockHash: block10Hash,
            address: profile,
            category: 'universalProfile',
          },
        ],
        (): Promise<[]> => Promise.resolve([]),
      ),
    ).rejects.toThrow('returned 0 results for 2 calls');
  });

  it('bounds large exact-block plans without changing candidate order', async () => {
    const batchSizes: number[] = [];
    const candidates = Array.from({ length: 72 }, (_, index) => ({
      blockNumber: 10,
      blockHash: block10Hash,
      address: toHex(BigInt(index + 1), { size: 20 }),
      category: 'digitalAsset' as const,
    }));
    const execute: ProjectionCallExecutor = (_block, calls) => {
      batchSizes.push(calls.length);
      return Promise.resolve(calls.map(() => ({ status: 'failure' as const })));
    };

    const result = await resolveProjectionVerifications(candidates, execute);

    expect(batchSizes).toEqual([MAX_MULTICALL_BATCH_SIZE, 4]);
    expect(result).toHaveLength(candidates.length);
    expect(result.map(({ address }) => address)).toEqual(candidates.map(({ address }) => address));
  });
});
