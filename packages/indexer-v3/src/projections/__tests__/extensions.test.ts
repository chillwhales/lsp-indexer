import {
  encodeFunctionData,
  encodeFunctionResult,
  getAddress,
  multicall3Abi,
  toHex,
  type Hex,
} from 'viem';
import { describe, expect, it, vi } from 'vitest';
import { loadRuntimeConfig } from '../../config/index.js';
import type { NetworkDatabase } from '../../db/client.js';
import type { EventFactRecord, EventIngestionBatch } from '../../events/decode.js';
import type { NetworkRpcClient } from '../../rpc/index.js';
import { MAX_MULTICALL_BATCH_SIZE } from '../batching.js';
import {
  CLAIM_STATUS_PAGE_SIZE,
  CLAIM_STATUS_POLL_INTERVAL_BLOCKS,
  CLAIM_STATUS_RETRY_INTERVAL_BLOCKS,
  createClaimStatusCallExecutor,
  loadClaimStatusCandidates,
  resolveClaimStatusUpdates,
  type ClaimStatusCallExecutor,
} from '../extensions.js';
import { CHILLWHALES_EXTENSION, ZERO_ADDRESS } from '../standards.js';

const tokenId = toHex(42n, { size: 32 });
const chillClaimAbi = [
  {
    type: 'function',
    name: 'getClaimedStatusFor',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'bytes32' }],
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

function encodeChillClaim(): Hex {
  return encodeFunctionData({
    abi: chillClaimAbi,
    functionName: 'getClaimedStatusFor',
    args: [tokenId],
  });
}

function mintBatch(): EventIngestionBatch {
  const blockHash = toHex(100n, { size: 32 });
  const event: EventFactRecord = {
    id: 'eip155:42:log:100:0:0',
    network: 'lukso-mainnet',
    chainId: 42,
    blockNumber: 100,
    blockHash,
    parentHash: toHex(99n, { size: 32 }),
    blockTimestamp: new Date('2026-01-01T00:00:00Z'),
    transactionHash: toHex(200n, { size: 32 }),
    transactionIndex: 0,
    logIndex: 0,
    address: CHILLWHALES_EXTENSION.collectionAddress,
    topic0: toHex(300n, { size: 32 }),
    topics: [toHex(300n, { size: 32 })],
    data: '0x',
    eventName: 'Transfer',
    eventDomain: 'lsp8',
    decoded: {
      operator: ZERO_ADDRESS,
      from: ZERO_ADDRESS,
      to: '0x0000000000000000000000000000000000000042',
      amount: '1',
      tokenId,
    },
  };
  return { blocks: [], events: [event], decodedEvents: 1, malformedEvents: 0 };
}

function fakeDatabase(rows: unknown[]): NetworkDatabase {
  const database = {
    select() {
      return {
        from() {
          return {
            where() {
              return {
                orderBy() {
                  return {
                    limit(size: number): Promise<unknown[]> {
                      return Promise.resolve(rows.slice(0, size));
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
  };
  return database as unknown as NetworkDatabase;
}

describe('Chillwhales product extension reads', () => {
  it('merges unresolved database rows with same-batch mints only on enabled networks', async () => {
    const lukso = loadRuntimeConfig({ INDEXER_NETWORK: 'lukso-mainnet' });
    const database = fakeDatabase([
      {
        address: CHILLWHALES_EXTENSION.collectionAddress,
        tokenId,
        chillClaimed: true,
        orbsClaimed: false,
      },
    ]);

    await expect(loadClaimStatusCandidates(database, lukso, mintBatch(), 100)).resolves.toEqual([
      {
        address: CHILLWHALES_EXTENSION.collectionAddress,
        tokenId,
        checkChill: false,
        checkOrbs: true,
      },
    ]);

    const ethereum = loadRuntimeConfig({ INDEXER_NETWORK: 'ethereum-mainnet' });
    await expect(loadClaimStatusCandidates(database, ethereum, mintBatch(), 100)).resolves.toEqual(
      [],
    );
  });

  it('emits monotonic updates and schedules failed calls for an earlier retry', async () => {
    const execute: ClaimStatusCallExecutor = (_block, calls) =>
      Promise.resolve(
        calls.map((call) =>
          call.kind === 'chill'
            ? { status: 'success' as const, value: true }
            : { status: 'failure' as const },
        ),
      );
    const blockHash = toHex(100n, { size: 32 });

    await expect(
      resolveClaimStatusUpdates(
        [
          {
            address: CHILLWHALES_EXTENSION.collectionAddress,
            tokenId,
            checkChill: true,
            checkOrbs: true,
          },
        ],
        { number: 100, hash: blockHash },
        execute,
      ),
    ).resolves.toEqual([
      {
        address: CHILLWHALES_EXTENSION.collectionAddress,
        tokenId,
        chillClaimed: true,
        orbsClaimed: false,
        blockNumber: 100,
        blockHash,
        nextCheckBlock: 100 + CLAIM_STATUS_RETRY_INTERVAL_BLOCKS,
      },
    ]);
  });

  it('binds claim-status Multicall3 reads to the current Portal block hash', async () => {
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
    const execute = createClaimStatusCallExecutor(rpc, runtime);

    await execute({ number: blockNumber, hash: blockHash }, [{ kind: 'chill', tokenId }]);

    const callData = encodeChillClaim();
    expect(request).toHaveBeenCalledWith({
      method: 'eth_call',
      params: [
        {
          to: runtime.network.multicall.address,
          data: encodeFunctionData({
            abi: multicall3Abi,
            functionName: 'aggregate3',
            args: [
              [
                {
                  target: getAddress(CHILLWHALES_EXTENSION.chillAddress),
                  allowFailure: true,
                  callData,
                },
              ],
            ],
          }),
        },
        { blockHash, requireCanonical: true },
      ],
    });
    expect(getBlock).toHaveBeenCalledTimes(2);
  });

  it('uses direct claim reads before the configured Multicall3 deployment', async () => {
    const blockHash = toHex(100n, { size: 32 });
    const request = vi.fn().mockResolvedValue(toHex(1n, { size: 32 }));
    const runtime = loadRuntimeConfig({ INDEXER_NETWORK: 'lukso-mainnet' });
    const rpc = {
      getBlock: vi.fn().mockResolvedValue({ hash: blockHash }),
      request,
    } as unknown as NetworkRpcClient;
    const execute = createClaimStatusCallExecutor(rpc, runtime);

    await expect(
      execute({ number: 100, hash: blockHash }, [{ kind: 'chill', tokenId }]),
    ).resolves.toEqual([{ status: 'success', value: true }]);
    expect(request).toHaveBeenCalledWith({
      method: 'eth_call',
      params: [
        { to: getAddress(CHILLWHALES_EXTENSION.chillAddress), data: encodeChillClaim() },
        { blockHash, requireCanonical: true },
      ],
    });
  });

  it('schedules false statuses at the normal cadence and rejects incomplete batches', async () => {
    const candidate = {
      address: CHILLWHALES_EXTENSION.collectionAddress,
      tokenId,
      checkChill: true,
      checkOrbs: false,
    };
    const blockHash = toHex(100n, { size: 32 });

    await expect(
      resolveClaimStatusUpdates(
        [candidate],
        { number: 100, hash: blockHash },
        (): Promise<[{ status: 'success'; value: false }]> =>
          Promise.resolve([{ status: 'success', value: false }]),
      ),
    ).resolves.toEqual([
      {
        address: CHILLWHALES_EXTENSION.collectionAddress,
        tokenId,
        chillClaimed: false,
        orbsClaimed: false,
        blockNumber: 100,
        blockHash,
        nextCheckBlock: 100 + CLAIM_STATUS_POLL_INTERVAL_BLOCKS,
      },
    ]);
    await expect(
      resolveClaimStatusUpdates(
        [candidate],
        { number: 100, hash: blockHash },
        (): Promise<[]> => Promise.resolve([]),
      ),
    ).rejects.toThrow('returned 0 results for 1 calls');
  });

  it('rejects malformed persisted token IDs and isolates malformed claim return data', async () => {
    const runtime = loadRuntimeConfig({ INDEXER_NETWORK: 'lukso-mainnet' });
    const database = fakeDatabase([
      {
        address: CHILLWHALES_EXTENSION.collectionAddress,
        tokenId: '0x12',
        chillClaimed: false,
        orbsClaimed: false,
      },
    ]);
    await expect(loadClaimStatusCandidates(database, runtime, mintBatch(), 100)).rejects.toThrow(
      'Persisted Chillwhales token ID is malformed',
    );

    const rpc = {
      getBlock: vi.fn().mockResolvedValue({
        hash: toHex(BigInt(runtime.network.multicall.fromBlock), { size: 32 }),
      }),
      request: vi
        .fn()
        .mockResolvedValue(encodeMulticallResults([{ success: true, returnData: '0x12' }])),
    } as unknown as NetworkRpcClient;
    const execute = createClaimStatusCallExecutor(rpc, runtime);
    await expect(
      execute(
        {
          number: runtime.network.multicall.fromBlock,
          hash: toHex(BigInt(runtime.network.multicall.fromBlock), { size: 32 }),
        },
        [{ kind: 'orbs', tokenId }],
      ),
    ).resolves.toEqual([{ status: 'failure' }]);
  });

  it('ignores ordinary non-mint facts during claim planning', async () => {
    const runtime = loadRuntimeConfig({ INDEXER_NETWORK: 'lukso-mainnet' });
    const batch = mintBatch();
    const mint = batch.events[0];
    if (mint == null) throw new Error('Expected mint fixture');
    mint.address = CHILLWHALES_EXTENSION.orbsAddress;

    await expect(loadClaimStatusCandidates(fakeDatabase([]), runtime, batch, 100)).resolves.toEqual(
      [],
    );
  });

  it('loads at most one persisted candidate page per head block', async () => {
    const runtime = loadRuntimeConfig({ INDEXER_NETWORK: 'lukso-mainnet' });
    const rows = Array.from({ length: CLAIM_STATUS_PAGE_SIZE + 10 }, (_, index) => ({
      address: CHILLWHALES_EXTENSION.collectionAddress,
      tokenId: toHex(BigInt(index + 1_000), { size: 32 }),
      chillClaimed: false,
      orbsClaimed: false,
    }));

    const candidates = await loadClaimStatusCandidates(
      fakeDatabase(rows),
      runtime,
      { blocks: [], events: [], decodedEvents: 0, malformedEvents: 0 },
      100,
    );

    expect(candidates).toHaveLength(CLAIM_STATUS_PAGE_SIZE);
  });

  it('bounds large claim plans while preserving every candidate', async () => {
    const batchSizes: number[] = [];
    const candidates = Array.from({ length: 251 }, (_, index) => ({
      address: CHILLWHALES_EXTENSION.collectionAddress,
      tokenId: toHex(BigInt(index), { size: 32 }),
      checkChill: true,
      checkOrbs: true,
    }));
    const execute: ClaimStatusCallExecutor = (_block, calls) => {
      batchSizes.push(calls.length);
      return Promise.resolve(calls.map(() => ({ status: 'success' as const, value: false })));
    };

    await expect(
      resolveClaimStatusUpdates(
        candidates,
        { number: 100, hash: toHex(100n, { size: 32 }) },
        execute,
      ),
    ).resolves.toHaveLength(candidates.length);
    expect(batchSizes).toEqual([MAX_MULTICALL_BATCH_SIZE, 2]);
  });
});
