import type { SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { toHex } from 'viem';
import { describe, expect, it } from 'vitest';
import { createDeterministicId, createTokenEntityId } from '../../db/identity.js';
import {
  chillwhalesNfts,
  controllers,
  creators,
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
import { CHILLWHALES_EXTENSION, DATA_KEYS, ZERO_ADDRESS } from '../standards.js';
import { loadProjectionState } from '../state.js';

const firstProfile = '0x0000000000000000000000000000000000000010';
const secondProfile = '0x0000000000000000000000000000000000000020';
const asset = CHILLWHALES_EXTENSION.collectionAddress;
const tokenId = toHex(42n, { size: 32 });

function event(
  logIndex: number,
  values: Pick<EventFactRecord, 'address' | 'eventName' | 'eventDomain' | 'decoded'>,
): EventFactRecord {
  return {
    id: `eip155:42:log:10:0:${logIndex}`,
    network: 'lukso-mainnet',
    chainId: 42,
    blockNumber: 10,
    blockHash: toHex(10n, { size: 32 }),
    parentHash: toHex(9n, { size: 32 }),
    blockTimestamp: new Date('2026-01-01T00:00:00Z'),
    transactionHash: toHex(100n, { size: 32 }),
    transactionIndex: 0,
    logIndex,
    topic0: toHex(200n, { size: 32 }),
    topics: [toHex(200n, { size: 32 })],
    data: '0x',
    ...values,
  };
}

function addressFor(value: number): string {
  return toHex(BigInt(value), { size: 20 });
}

function fakeTransaction(
  rows: ReadonlyMap<unknown, readonly unknown[]>,
  selected: Set<unknown>,
  predicates?: Map<unknown, SQL>,
  queryCounts?: Map<unknown, number>,
): PersistenceHandlerContext['tx'] {
  const transaction = {
    select() {
      return {
        from(table: unknown) {
          selected.add(table);
          return {
            where(predicate: SQL): Promise<readonly unknown[]> {
              predicates?.set(table, predicate);
              queryCounts?.set(table, (queryCounts.get(table) ?? 0) + 1);
              return Promise.resolve(rows.get(table) ?? []);
            },
          };
        },
      };
    },
  };
  return transaction as unknown as PersistenceHandlerContext['tx'];
}

describe('projection state loader', () => {
  it('loads and keys every current-state domain touched by a batch', async () => {
    const creatorKey = `${DATA_KEYS.lsp4CreatorsMap}${firstProfile.slice(2)}`;
    const issuedKey = `${DATA_KEYS.lsp12IssuedAssetsMap}${asset.slice(2)}`;
    const controllerKey = `${DATA_KEYS.lsp6Permissions}${secondProfile.slice(2)}`;
    const events = [
      event(0, {
        address: asset,
        eventName: 'Transfer',
        eventDomain: 'lsp8',
        decoded: {
          operator: ZERO_ADDRESS,
          from: firstProfile,
          to: secondProfile,
          amount: '1',
          tokenId,
        },
      }),
      event(1, {
        address: asset,
        eventName: 'DataChanged',
        eventDomain: 'erc725y',
        decoded: { dataKey: creatorKey, dataValue: '0x' },
      }),
      event(2, {
        address: firstProfile,
        eventName: 'DataChanged',
        eventDomain: 'erc725y',
        decoded: { dataKey: issuedKey, dataValue: '0x' },
      }),
      event(3, {
        address: firstProfile,
        eventName: 'DataChanged',
        eventDomain: 'erc725y',
        decoded: { dataKey: controllerKey, dataValue: toHex(1n, { size: 32 }) },
      }),
      event(4, {
        address: '0xf01103e5a9909fc0dbe8166da7085e0285daddca',
        eventName: 'Follow',
        eventDomain: 'lsp26',
        decoded: { followerAddress: firstProfile, followedAddress: secondProfile },
      }),
    ];
    const rows = new Map<unknown, readonly unknown[]>([
      [universalProfiles, [{ address: firstProfile }, { address: secondProfile }]],
      [digitalAssets, [{ address: asset }]],
      [nfts, [{ address: asset, tokenId }]],
      [ownedAssets, [{ ownerAddress: firstProfile, assetAddress: asset }]],
      [ownedTokens, [{ ownerAddress: firstProfile, assetAddress: asset, tokenId }]],
      [followerEdges, [{ followerAddress: firstProfile, followedAddress: secondProfile }]],
      [creators, [{ assetAddress: asset, creatorAddress: firstProfile }]],
      [issuedAssets, [{ issuerAddress: firstProfile, assetAddress: asset }]],
      [controllers, [{ profileAddress: firstProfile, controllerAddress: secondProfile }]],
      [chillwhalesNfts, [{ address: asset, tokenId }]],
    ]);
    const selected = new Set<unknown>();
    const predicates = new Map<unknown, SQL>();
    const claimStatusUpdates = [
      {
        address: asset,
        tokenId,
        chillClaimed: true,
        orbsClaimed: false,
        blockNumber: 10,
        blockHash: toHex(10n, { size: 32 }),
        nextCheckBlock: 730,
      },
    ];

    const state = await loadProjectionState(
      fakeTransaction(rows, selected, predicates),
      42,
      events,
      claimStatusUpdates,
    );

    expect(selected).toEqual(new Set(rows.keys()));
    expect(state.universalProfiles.has(firstProfile)).toBe(true);
    expect(state.digitalAssets.has(asset)).toBe(true);
    expect(state.nfts.has(`${asset}:${tokenId}`)).toBe(true);
    expect(state.ownedAssets.has(`${firstProfile}:${asset}`)).toBe(true);
    expect(state.ownedTokens.has(`${firstProfile}:${asset}:${tokenId}`)).toBe(true);
    expect(state.followerEdges.has(`${firstProfile}:${secondProfile}`)).toBe(true);
    expect(state.creators.has(`${asset}:${firstProfile}`)).toBe(true);
    expect(state.issuedAssets.has(`${firstProfile}:${asset}`)).toBe(true);
    expect(state.controllers.has(`${firstProfile}:${secondProfile}`)).toBe(true);
    expect(state.chillwhalesNfts.has(`${asset}:${tokenId}`)).toBe(true);

    const dialect = new PgDialect();
    const nftPredicate = predicates.get(nfts);
    const ownedAssetPredicate = predicates.get(ownedAssets);
    const ownedTokenPredicate = predicates.get(ownedTokens);
    const followerPredicate = predicates.get(followerEdges);
    const extensionPredicate = predicates.get(chillwhalesNfts);
    if (
      nftPredicate == null ||
      ownedAssetPredicate == null ||
      ownedTokenPredicate == null ||
      followerPredicate == null ||
      extensionPredicate == null
    ) {
      throw new Error('Expected exact-token projection predicates');
    }
    const nftQuery = dialect.sqlToQuery(nftPredicate);
    const ownedAssetQuery = dialect.sqlToQuery(ownedAssetPredicate);
    const ownedTokenQuery = dialect.sqlToQuery(ownedTokenPredicate);
    const followerQuery = dialect.sqlToQuery(followerPredicate);
    const extensionQuery = dialect.sqlToQuery(extensionPredicate);
    expect(nftQuery.sql).toContain('"nfts"."id" in');
    expect(nftQuery.params).toContain(createTokenEntityId(42, asset, tokenId));
    expect(ownedAssetQuery.sql).toContain('"owned_assets"."id" in');
    expect(ownedAssetQuery.params).toEqual(
      expect.arrayContaining([
        createDeterministicId('owned-asset', 42, [firstProfile, asset]),
        createDeterministicId('owned-asset', 42, [secondProfile, asset]),
      ]),
    );
    expect(ownedTokenQuery.sql).toContain('"owned_tokens"."id" in');
    expect(ownedTokenQuery.params).toEqual(
      expect.arrayContaining([
        createDeterministicId('owned-token', 42, [firstProfile, asset, tokenId]),
        createDeterministicId('owned-token', 42, [secondProfile, asset, tokenId]),
      ]),
    );
    expect(followerQuery.sql).toContain('"follower_edges"."id" in');
    expect(followerQuery.params).toContain(
      createDeterministicId('follower', 42, [firstProfile, secondProfile]),
    );
    expect(extensionQuery.sql).toContain('"chillwhales_nfts"."id" in');
    expect(extensionQuery.params).toContain(
      createDeterministicId('chillwhales-nft', 42, [asset, tokenId]),
    );
  });

  it('does not issue table reads for an empty event and extension update set', async () => {
    const selected = new Set<unknown>();
    const state = await loadProjectionState(fakeTransaction(new Map(), selected), 42, []);
    const stateRows = [
      state.universalProfiles,
      state.digitalAssets,
      state.nfts,
      state.ownedAssets,
      state.ownedTokens,
      state.followerEdges,
      state.creators,
      state.issuedAssets,
      state.controllers,
      state.chillwhalesNfts,
    ];

    expect(selected.size).toBe(0);
    expect(stateRows.every((rows) => rows.size === 0)).toBe(true);
  });

  it('loads the verified asset and extension row for a polling-only claim update', async () => {
    const rows = new Map<unknown, readonly unknown[]>([
      [digitalAssets, [{ address: asset, verification: 'verified' }]],
      [chillwhalesNfts, [{ address: asset, tokenId }]],
    ]);
    const selected = new Set<unknown>();
    const state = await loadProjectionState(
      fakeTransaction(rows, selected),
      42,
      [],
      [
        {
          address: asset,
          tokenId,
          chillClaimed: true,
          orbsClaimed: false,
          blockNumber: 10,
          blockHash: toHex(10n, { size: 32 }),
          nextCheckBlock: 730,
        },
      ],
    );

    expect(selected).toEqual(new Set([digitalAssets, chillwhalesNfts]));
    expect(state.digitalAssets.has(asset)).toBe(true);
    expect(state.chillwhalesNfts.has(`${asset}:${tokenId}`)).toBe(true);
  });

  it('loads creator rows that reference profiles being reverified', async () => {
    const predicates = new Map<unknown, SQL>();
    const profileEvidence = event(0, {
      address: asset,
      eventName: 'Follow',
      eventDomain: 'lsp26',
      decoded: { followerAddress: firstProfile, followedAddress: secondProfile },
    });

    await loadProjectionState(fakeTransaction(new Map(), new Set(), predicates), 42, [
      profileEvidence,
    ]);

    const creatorPredicate = predicates.get(creators);
    if (creatorPredicate == null) throw new Error('Expected a reverse creator predicate');
    const query = new PgDialect().sqlToQuery(creatorPredicate);
    expect(query.sql).toContain('"creators"."creator_address" in');
    expect(query.params).toEqual(expect.arrayContaining([firstProfile, secondProfile]));
  });

  it('loads a full NFT collection only for collection-wide derived-value changes', async () => {
    const selected = new Set<unknown>();
    const predicates = new Map<unknown, SQL>();
    const baseUriChange = event(0, {
      address: asset,
      eventName: 'DataChanged',
      eventDomain: 'erc725y',
      decoded: { dataKey: DATA_KEYS.lsp8MetadataBaseUri, dataValue: '0x' },
    });

    await loadProjectionState(fakeTransaction(new Map(), selected, predicates), 42, [
      baseUriChange,
    ]);

    const nftPredicate = predicates.get(nfts);
    if (nftPredicate == null) throw new Error('Expected a collection NFT predicate');
    const query = new PgDialect().sqlToQuery(nftPredicate);
    expect(query.sql).toContain('"nfts"."address" in');
    expect(query.sql).not.toContain('"nfts"."id" in');
    expect(query.params).toContain(asset);
  });

  it('chunks large state scopes into PostgreSQL-safe lookup queries', async () => {
    const transfers = Array.from({ length: 5_001 }, (_, index) =>
      event(index, {
        address: asset,
        eventName: 'Transfer',
        eventDomain: 'lsp8',
        decoded: {
          operator: ZERO_ADDRESS,
          from: addressFor(1_000 + index * 2),
          to: addressFor(1_001 + index * 2),
          amount: '1',
          tokenId: toHex(BigInt(index + 1), { size: 32 }),
        },
      }),
    );
    const selected = new Set<unknown>();
    const queryCounts = new Map<unknown, number>();

    await loadProjectionState(
      fakeTransaction(new Map(), selected, undefined, queryCounts),
      42,
      transfers,
    );

    expect(queryCounts.get(universalProfiles)).toBe(2);
    expect(queryCounts.get(ownedAssets)).toBe(2);
    expect(queryCounts.get(ownedTokens)).toBe(2);
    expect(queryCounts.get(nfts)).toBe(1);
  });
});
