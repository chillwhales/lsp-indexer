import { toHex } from 'viem';
import { describe, expect, it, vi } from 'vitest';
import { loadRuntimeConfig } from '../../config/index.js';
import type { NetworkDatabase } from '../../db/client.js';
import type { EventFactRecord, EventIngestionBatch } from '../../events/decode.js';
import type { NetworkRpcClient } from '../../rpc/index.js';
import {
  createClaimStatusCallExecutor,
  loadClaimStatusCandidates,
  resolveClaimStatusUpdates,
  type ClaimStatusCallExecutor,
} from '../extensions.js';
import { CHILLWHALES_EXTENSION, ZERO_ADDRESS } from '../standards.js';

const tokenId = toHex(42n, { size: 32 });

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
            where(): Promise<unknown[]> {
              return Promise.resolve(rows);
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

    await expect(loadClaimStatusCandidates(database, lukso, mintBatch())).resolves.toEqual([
      {
        address: CHILLWHALES_EXTENSION.collectionAddress,
        tokenId,
        checkChill: false,
        checkOrbs: true,
      },
    ]);

    const ethereum = loadRuntimeConfig({ INDEXER_NETWORK: 'ethereum-mainnet' });
    await expect(loadClaimStatusCandidates(database, ethereum, mintBatch())).resolves.toEqual([]);
  });

  it('emits only monotonic true transitions and tolerates individual call failures', async () => {
    const execute: ClaimStatusCallExecutor = (_blockNumber, calls) =>
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
        100,
        blockHash,
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
      },
    ]);
  });

  it('pins claim calls to the current block and configured Multicall3 deployment', async () => {
    const multicall = vi.fn().mockResolvedValue([{ status: 'success', result: true }]);
    const runtime = loadRuntimeConfig({ INDEXER_NETWORK: 'lukso-mainnet' });
    const rpc = { multicall } as unknown as NetworkRpcClient;
    const execute = createClaimStatusCallExecutor(rpc, runtime);

    await execute(100, [{ kind: 'chill', tokenId }]);

    expect(multicall).toHaveBeenCalledWith(
      expect.objectContaining({
        blockNumber: 100n,
        multicallAddress: runtime.network.multicallAddress,
        allowFailure: true,
      }),
    );
  });

  it('returns no mutation for false statuses and rejects incomplete batches', async () => {
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
        100,
        blockHash,
        (): Promise<[{ status: 'success'; value: false }]> =>
          Promise.resolve([{ status: 'success', value: false }]),
      ),
    ).resolves.toEqual([]);
    await expect(
      resolveClaimStatusUpdates(
        [candidate],
        100,
        blockHash,
        (): Promise<[]> => Promise.resolve([]),
      ),
    ).rejects.toThrow('returned 0 results for 1 calls');
  });

  it('rejects malformed persisted token IDs and malformed successful RPC values', async () => {
    const runtime = loadRuntimeConfig({ INDEXER_NETWORK: 'lukso-mainnet' });
    const database = fakeDatabase([
      {
        address: CHILLWHALES_EXTENSION.collectionAddress,
        tokenId: '0x12',
        chillClaimed: false,
        orbsClaimed: false,
      },
    ]);
    await expect(loadClaimStatusCandidates(database, runtime, mintBatch())).rejects.toThrow(
      'Persisted Chillwhales token ID is malformed',
    );

    const rpc = {
      multicall: vi.fn().mockResolvedValue([{ status: 'success', result: 1 }]),
    } as unknown as NetworkRpcClient;
    const execute = createClaimStatusCallExecutor(rpc, runtime);
    await expect(execute(100, [{ kind: 'orbs', tokenId }])).rejects.toThrow(
      'invalid success value',
    );
  });

  it('ignores ordinary non-mint facts during claim planning', async () => {
    const runtime = loadRuntimeConfig({ INDEXER_NETWORK: 'lukso-mainnet' });
    const batch = mintBatch();
    const mint = batch.events[0];
    if (mint == null) throw new Error('Expected mint fixture');
    mint.address = CHILLWHALES_EXTENSION.orbsAddress;

    await expect(loadClaimStatusCandidates(fakeDatabase([]), runtime, batch)).resolves.toEqual([]);
  });
});
