import { toHex } from 'viem';
import { describe, expect, it } from 'vitest';
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

function fakeTransaction(
  rows: ReadonlyMap<unknown, readonly unknown[]>,
  selected: Set<unknown>,
): PersistenceHandlerContext['tx'] {
  const transaction = {
    select() {
      return {
        from(table: unknown) {
          selected.add(table);
          return {
            where(): Promise<readonly unknown[]> {
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

    const state = await loadProjectionState(fakeTransaction(rows, selected), 42, events);

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
});
