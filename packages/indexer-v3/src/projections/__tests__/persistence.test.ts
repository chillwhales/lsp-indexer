import { getTableName } from 'drizzle-orm';
import { toHex } from 'viem';
import { describe, expect, it } from 'vitest';
import { loadRuntimeConfig } from '../../config/index.js';
import type { NetworkDatabase } from '../../db/client.js';
import { createDataValueId } from '../../db/identity.js';
import {
  chillwhalesNfts,
  controllers,
  creators,
  dataValues,
  digitalAssets,
  followerEdges,
  issuedAssets,
  nfts,
  ownedAssets,
  ownedTokens,
  universalProfiles,
} from '../../db/schema.js';
import type { PersistenceHandlerContext } from '../../db/target.js';
import type { EventFactRecord } from '../../events/decode.js';
import {
  applyProjectionMutations,
  assertProjectionReplayStart,
  filterEffectiveMetadataEvents,
} from '../persistence.js';
import type { ProjectionMutations } from '../reducer.js';
import { DATA_KEYS } from '../standards.js';

const profile = '0x0000000000000000000000000000000000000010';
const asset = '0x0000000000000000000000000000000000000020';
const tokenId = toHex(42n, { size: 32 });
const blockHash = toHex(100n, { size: 32 });
const transactionHash = toHex(200n, { size: 32 });

interface FakeWriteState {
  deletedTables: string[];
  insertedSizes: Map<string, number[]>;
}

function fakeCursorDatabase(rows: unknown[]): NetworkDatabase {
  const database = {
    select() {
      return {
        from() {
          return {
            where() {
              return {
                orderBy() {
                  return {
                    limit(): Promise<unknown[]> {
                      return Promise.resolve(rows);
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

describe('projection replay start guard', () => {
  it('requires a fresh or reset schema to replay from the configured network start', async () => {
    const runtime = loadRuntimeConfig({
      INDEXER_NETWORK: 'ethereum-mainnet',
      INDEXER_FROM_BLOCK: '10',
    });

    await expect(assertProjectionReplayStart(fakeCursorDatabase([]), runtime)).rejects.toThrow(
      'has no cursor and must start at block 0; received 10',
    );
  });

  it('allows a contiguous continuation and rejects a gap after the latest cursor', async () => {
    const contiguous = loadRuntimeConfig({
      INDEXER_NETWORK: 'ethereum-mainnet',
      INDEXER_FROM_BLOCK: '10',
    });
    await expect(
      assertProjectionReplayStart(fakeCursorDatabase([{ currentNumber: '9' }]), contiguous),
    ).resolves.toBeUndefined();

    const gap = loadRuntimeConfig({
      INDEXER_NETWORK: 'ethereum-mainnet',
      INDEXER_FROM_BLOCK: '12',
    });
    await expect(
      assertProjectionReplayStart(fakeCursorDatabase([{ currentNumber: '9' }]), gap),
    ).rejects.toThrow('would skip blocks 10-11');
  });
});

function fakeTransaction(): {
  tx: PersistenceHandlerContext['tx'];
  state: FakeWriteState;
} {
  const state: FakeWriteState = { deletedTables: [], insertedSizes: new Map() };
  const transaction = {
    delete(table: unknown) {
      return {
        where(): Promise<void> {
          state.deletedTables.push(getTableName(table as typeof ownedAssets));
          return Promise.resolve();
        },
      };
    },
    insert(table: unknown) {
      const name = getTableName(table as typeof universalProfiles);
      return {
        values(records: unknown[]) {
          const sizes = state.insertedSizes.get(name) ?? [];
          sizes.push(records.length);
          state.insertedSizes.set(name, sizes);
          return {
            onConflictDoUpdate(): Promise<void> {
              return Promise.resolve();
            },
          };
        },
      };
    },
  };
  return { tx: transaction as unknown as PersistenceHandlerContext['tx'], state };
}

function mutations(): ProjectionMutations {
  const provenance = {
    lastBlockNumber: 100,
    lastBlockHash: blockHash,
    lastTransactionHash: transactionHash,
    lastTransactionIndex: 0,
    lastLogIndex: 0,
  };
  return {
    universalProfiles: [
      {
        id: 'profile-id',
        network: 'lukso-mainnet',
        chainId: 42,
        address: profile,
        ownerAddress: profile,
        verification: 'verified',
        ...provenance,
      },
    ],
    digitalAssets: [
      {
        id: 'asset-id',
        network: 'lukso-mainnet',
        chainId: 42,
        address: asset,
        ownerAddress: profile,
        standard: 'lsp8',
        tokenType: 1,
        name: 'Asset',
        symbol: 'AST',
        decimals: null,
        totalSupply: '1',
        tokenIdFormat: 0,
        tokenIdReferenceContract: null,
        baseUri: 'ipfs://asset',
        verification: 'verified',
        ...provenance,
      },
    ],
    nfts: [
      {
        id: 'nft-id',
        network: 'lukso-mainnet',
        chainId: 42,
        address: asset,
        tokenId,
        formattedTokenId: '42',
        isMinted: true,
        isBurned: false,
        ownerAddress: profile,
        tokenUri: 'ipfs://asset/42',
        verification: 'verified',
        ...provenance,
      },
    ],
    ownedAssets: [
      {
        id: 'owned-asset-id',
        network: 'lukso-mainnet',
        chainId: 42,
        ownerAddress: profile,
        assetAddress: asset,
        balance: '1',
        ...provenance,
      },
    ],
    ownedTokens: [
      {
        id: 'owned-token-id',
        network: 'lukso-mainnet',
        chainId: 42,
        ownerAddress: profile,
        assetAddress: asset,
        tokenId,
        balance: '1',
        ...provenance,
      },
    ],
    followerEdges: [
      {
        id: 'follower-id',
        network: 'lukso-mainnet',
        chainId: 42,
        followerAddress: profile,
        followedAddress: asset,
        isFollowing: true,
        followedAt: new Date('2026-01-01T00:00:00Z'),
        unfollowedAt: null,
        ...provenance,
      },
    ],
    creators: [
      {
        id: 'creator-id',
        network: 'lukso-mainnet',
        chainId: 42,
        assetAddress: asset,
        creatorAddress: profile,
        arrayIndex: 0n,
        interfaceId: '0x24871b3d',
        verified: true,
        ...provenance,
      },
    ],
    issuedAssets: [
      {
        id: 'issued-id',
        network: 'lukso-mainnet',
        chainId: 42,
        issuerAddress: profile,
        assetAddress: asset,
        arrayIndex: 0n,
        interfaceId: '0xc52d6008',
        ...provenance,
      },
    ],
    controllers: [
      {
        id: 'controller-id',
        network: 'lukso-mainnet',
        chainId: 42,
        profileAddress: profile,
        controllerAddress: asset,
        arrayIndex: 0n,
        permissions: toHex(1n, { size: 32 }),
        allowedCalls: [],
        allowedDataKeys: [],
        ...provenance,
      },
    ],
    chillwhalesNfts: [
      {
        id: 'chillwhales-id',
        network: 'lukso-mainnet',
        chainId: 42,
        address: asset,
        tokenId,
        chillClaimed: false,
        orbsClaimed: false,
        claimCheckAfterBlock: 0,
        level: 0,
        cooldownExpiry: 0,
        faction: 'Neutral',
        ...provenance,
      },
    ],
    dataValues: [
      {
        id: 'data-id',
        network: 'lukso-mainnet',
        chainId: 42,
        address: asset,
        tokenId: null,
        dataKey: toHex(300n, { size: 32 }),
        dataValue: '0x',
        ...provenance,
      },
    ],
    deletedOwnedAssetIds: ['old-owned-asset'],
    deletedOwnedTokenIds: ['old-owned-token'],
    deletedNftCollections: [{ chainId: 42, address: asset }],
    deletedCreatorIds: ['old-creator'],
    deletedIssuedAssetIds: ['old-issued'],
    deletedControllerIds: ['old-controller'],
  };
}

describe('projection mutation persistence', () => {
  it('removes unchanged control events without hiding effective or unrelated facts', () => {
    const repeatedControl: EventFactRecord = {
      id: 'repeated-control',
      network: 'lukso-mainnet',
      chainId: 42,
      blockNumber: 100,
      blockHash,
      parentHash: toHex(99n, { size: 32 }),
      blockTimestamp: new Date('2026-01-01T00:00:00Z'),
      transactionHash,
      transactionIndex: 0,
      logIndex: 0,
      address: asset,
      eventName: 'DataChanged',
      eventDomain: 'erc725y',
      topic0: toHex(1n, { size: 32 }),
      topics: [toHex(1n, { size: 32 })],
      data: '0x',
      decoded: { dataKey: DATA_KEYS.lsp8MetadataBaseUri, dataValue: '0x' },
    };
    const effectiveControl: EventFactRecord = {
      ...repeatedControl,
      id: 'effective-control',
      logIndex: 1,
      decoded: { dataKey: DATA_KEYS.lsp8TokenIdFormat, dataValue: '0x00' },
    };
    const unrelatedTransfer: EventFactRecord = {
      ...repeatedControl,
      id: 'unrelated-transfer',
      logIndex: 2,
      eventName: 'Transfer',
      eventDomain: 'lsp8',
      decoded: { tokenId },
    };
    const row = mutations().dataValues[0];
    if (row == null) throw new Error('Expected a data-value mutation fixture');
    const effectiveRow = {
      ...row,
      id: createDataValueId(42, asset, DATA_KEYS.lsp8TokenIdFormat),
      dataKey: DATA_KEYS.lsp8TokenIdFormat,
      dataValue: '0x00',
    };

    expect(
      filterEffectiveMetadataEvents(
        [repeatedControl, effectiveControl, unrelatedTransfer],
        [effectiveRow],
      ).map(({ id }) => id),
    ).toEqual(['effective-control', 'unrelated-transfer']);
  });

  it('deletes stale relationships before upserting every current-state table', async () => {
    const { tx, state } = fakeTransaction();
    await applyProjectionMutations(tx, mutations());

    expect(state.deletedTables).toEqual([
      'owned_tokens',
      'nfts',
      'owned_assets',
      'creators',
      'issued_assets',
      'controllers',
    ]);
    expect([...state.insertedSizes.keys()]).toEqual([
      getTableName(universalProfiles),
      getTableName(digitalAssets),
      getTableName(nfts),
      getTableName(ownedAssets),
      getTableName(ownedTokens),
      getTableName(followerEdges),
      getTableName(creators),
      getTableName(issuedAssets),
      getTableName(controllers),
      getTableName(chillwhalesNfts),
      getTableName(dataValues),
    ]);
  });

  it('chunks large projection writes without issuing empty operations', async () => {
    const { tx, state } = fakeTransaction();
    const values = mutations();
    const profile = values.universalProfiles[0];
    if (profile == null) throw new Error('Expected a universal-profile mutation fixture');
    values.universalProfiles = Array.from({ length: 501 }, (_, index) => ({
      ...profile,
      id: `profile-${index}`,
    }));
    values.digitalAssets = [];
    values.nfts = [];
    values.ownedAssets = [];
    values.ownedTokens = [];
    values.followerEdges = [];
    values.creators = [];
    values.issuedAssets = [];
    values.controllers = [];
    values.chillwhalesNfts = [];
    values.dataValues = [];
    values.deletedOwnedAssetIds = [];
    values.deletedOwnedTokenIds = [];
    values.deletedNftCollections = [];
    values.deletedCreatorIds = [];
    values.deletedIssuedAssetIds = [];
    values.deletedControllerIds = [];

    await applyProjectionMutations(tx, values);

    expect(state.deletedTables).toEqual([]);
    expect(state.insertedSizes).toEqual(new Map([['universal_profiles', [500, 1]]]));
  });

  it('replaces changed array relationships before upsert to avoid unique-index swaps', async () => {
    const { tx, state } = fakeTransaction();
    const values = mutations();
    values.deletedOwnedAssetIds = [];
    values.deletedOwnedTokenIds = [];
    values.deletedNftCollections = [];
    values.deletedCreatorIds = [];
    values.deletedIssuedAssetIds = [];
    values.deletedControllerIds = [];

    await applyProjectionMutations(tx, values);

    expect(state.deletedTables).toEqual(['creators', 'issued_assets', 'controllers']);
  });
});
