import { stringToHex, toHex } from 'viem';
import { describe, expect, it } from 'vitest';
import { loadRuntimeConfig, type RuntimeConfig } from '../../config/index.js';
import type { EventFactRecord, EventIngestionBatch } from '../../events/decode.js';
import { collectProjectionCandidates } from '../candidates.js';
import { reduceProjectionEvents } from '../reducer.js';
import type { AssetStandard, ProjectionVerification } from '../rpc.js';
import { CHILLWHALES_EXTENSION, DATA_KEYS, ZERO_ADDRESS } from '../standards.js';
import type { ProjectionState } from '../state.js';

const asset = '0x0000000000000000000000000000000000000010';
const alice = '0x0000000000000000000000000000000000000020';
const bob = '0x0000000000000000000000000000000000000030';
const controller = '0x0000000000000000000000000000000000000040';
const tokenId = toHex(42n, { size: 32 });

function emptyState(): ProjectionState {
  return {
    universalProfiles: new Map(),
    digitalAssets: new Map(),
    nfts: new Map(),
    ownedAssets: new Map(),
    ownedTokens: new Map(),
    followerEdges: new Map(),
    creators: new Map(),
    issuedAssets: new Map(),
    controllers: new Map(),
    chillwhalesNfts: new Map(),
  };
}

function event(
  runtime: RuntimeConfig,
  blockNumber: number,
  logIndex: number,
  values: Pick<EventFactRecord, 'address' | 'eventName' | 'eventDomain' | 'decoded'>,
): EventFactRecord {
  const blockHash = toHex(BigInt(blockNumber), { size: 32 });
  return {
    id: `eip155:${runtime.network.chainId}:log:${blockNumber}:0:${logIndex}`,
    network: runtime.network.key,
    chainId: runtime.network.chainId,
    blockNumber,
    blockHash,
    parentHash: toHex(BigInt(Math.max(0, blockNumber - 1)), { size: 32 }),
    blockTimestamp: new Date((1_700_000_000 + blockNumber) * 1_000),
    transactionHash: toHex(BigInt(10_000 + blockNumber), { size: 32 }),
    transactionIndex: 0,
    logIndex,
    topic0: toHex(999n, { size: 32 }),
    topics: [toHex(999n, { size: 32 })],
    data: '0x',
    ...values,
  };
}

function verifications(
  events: readonly EventFactRecord[],
  profileAddresses: readonly string[],
  assetStandards: ReadonlyMap<string, AssetStandard>,
): ProjectionVerification[] {
  const batch: EventIngestionBatch = {
    blocks: [],
    events: [...events],
    decodedEvents: events.length,
    malformedEvents: 0,
  };
  const profiles = new Set(profileAddresses);
  return collectProjectionCandidates(batch).map((candidate) => {
    const standard = assetStandards.get(candidate.address) ?? null;
    const verified =
      candidate.category === 'universalProfile'
        ? profiles.has(candidate.address)
        : standard != null;
    return {
      ...candidate,
      status: verified ? 'verified' : 'invalid',
      standard: candidate.category === 'digitalAsset' && verified ? standard : null,
      decimals:
        candidate.category === 'digitalAsset' && verified && standard === 'lsp7' ? 18 : null,
    };
  });
}

function transfer(
  runtime: RuntimeConfig,
  blockNumber: number,
  address: string,
  domain: 'lsp7' | 'lsp8',
  from: string,
  to: string,
  amount: string,
): EventFactRecord {
  return event(runtime, blockNumber, 0, {
    address,
    eventName: 'Transfer',
    eventDomain: domain,
    decoded: {
      operator: ZERO_ADDRESS,
      from,
      to,
      amount,
      tokenId: domain === 'lsp8' ? tokenId : null,
      force: true,
      data: '0x',
    },
  });
}

function dataChanged(
  runtime: RuntimeConfig,
  blockNumber: number,
  address: string,
  dataKey: string,
  dataValue: string,
  logIndex = 0,
): EventFactRecord {
  return event(runtime, blockNumber, logIndex, {
    address,
    eventName: 'DataChanged',
    eventDomain: 'erc725y',
    decoded: { dataKey, dataValue },
  });
}

describe('deterministic v3 domain reducer', () => {
  it('retains raw ERC725Y state for invalid emitters without creating typed entities', () => {
    const runtime = loadRuntimeConfig({ INDEXER_NETWORK: 'lukso-mainnet' });
    const change = dataChanged(runtime, 1, asset, DATA_KEYS.lsp4TokenName, stringToHex('Invalid'));
    const mutations = reduceProjectionEvents(
      runtime,
      emptyState(),
      [change],
      verifications([change], [], new Map()),
    );

    expect(mutations.universalProfiles).toEqual([]);
    expect(mutations.digitalAssets).toEqual([]);
    expect(mutations.dataValues).toEqual([
      expect.objectContaining({
        chainId: 42,
        address: asset,
        dataKey: DATA_KEYS.lsp4TokenName,
        dataValue: stringToHex('Invalid'),
      }),
    ]);
  });

  it('orders LSP7 mint, transfer, and burn facts and produces exact supply and balances', () => {
    const runtime = loadRuntimeConfig({ INDEXER_NETWORK: 'lukso-mainnet' });
    const events = [
      transfer(runtime, 4, asset, 'lsp7', bob, ZERO_ADDRESS, '1'),
      transfer(runtime, 2, asset, 'lsp7', ZERO_ADDRESS, alice, '10'),
      transfer(runtime, 3, asset, 'lsp7', alice, bob, '4'),
    ];
    const mutations = reduceProjectionEvents(
      runtime,
      emptyState(),
      events,
      verifications(events, [alice, bob], new Map([[asset, 'lsp7']])),
    );

    expect(mutations.digitalAssets).toEqual([
      expect.objectContaining({
        chainId: 42,
        address: asset,
        standard: 'lsp7',
        decimals: 18,
        totalSupply: '9',
      }),
    ]);
    expect(mutations.ownedAssets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ownerAddress: alice, assetAddress: asset, balance: '6' }),
        expect.objectContaining({ ownerAddress: bob, assetAddress: asset, balance: '3' }),
      ]),
    );
    expect(mutations.universalProfiles).toHaveLength(2);
    expect(mutations.digitalAssets[0]?.id).toContain('eip155:42');
  });

  it('projects LSP8 formatting, ownership, token URI, burn cleanup, and supply across batches', () => {
    const runtime = loadRuntimeConfig({ INDEXER_NETWORK: 'lukso-mainnet' });
    const baseUri = `0x0000000000000000${stringToHex('ipfs://collection').slice(2)}`;
    const setup = [
      dataChanged(runtime, 1, asset, DATA_KEYS.lsp8TokenIdFormat, '0x00'),
      transfer(runtime, 2, asset, 'lsp8', ZERO_ADDRESS, alice, '1'),
      transfer(runtime, 3, asset, 'lsp8', alice, bob, '1'),
    ];
    const state = emptyState();
    const first = reduceProjectionEvents(
      runtime,
      state,
      setup,
      verifications(setup, [alice, bob], new Map([[asset, 'lsp8']])),
    );

    expect(first.nfts).toEqual([
      expect.objectContaining({
        tokenId,
        formattedTokenId: '42',
        ownerAddress: bob,
        tokenUri: null,
        isMinted: true,
        isBurned: false,
      }),
    ]);
    expect(first.ownedTokens).toEqual([
      expect.objectContaining({ ownerAddress: bob, tokenId, balance: '1' }),
    ]);
    expect(first.ownedAssets).toEqual([
      expect.objectContaining({ ownerAddress: bob, balance: '1' }),
    ]);

    const baseUriChange = dataChanged(runtime, 4, asset, DATA_KEYS.lsp8MetadataBaseUri, baseUri);
    const second = reduceProjectionEvents(
      runtime,
      state,
      [baseUriChange],
      verifications([baseUriChange], [], new Map([[asset, 'lsp8']])),
    );
    expect(second.nfts).toEqual([
      expect.objectContaining({
        tokenUri: 'ipfs://collection/42',
        lastBlockNumber: 4,
        lastBlockHash: baseUriChange.blockHash,
        lastTransactionHash: baseUriChange.transactionHash,
      }),
    ]);

    const burn = transfer(runtime, 5, asset, 'lsp8', bob, ZERO_ADDRESS, '1');
    const third = reduceProjectionEvents(
      runtime,
      state,
      [burn],
      verifications([burn], [bob], new Map([[asset, 'lsp8']])),
    );
    expect(third.nfts).toEqual([
      expect.objectContaining({ ownerAddress: null, isMinted: false, isBurned: true }),
    ]);
    expect(third.digitalAssets).toEqual([expect.objectContaining({ totalSupply: '0' })]);
    expect(third.ownedAssets).toEqual([]);
    expect(third.ownedTokens).toEqual([]);
    expect(third.deletedOwnedAssetIds).toHaveLength(1);
    expect(third.deletedOwnedTokenIds).toHaveLength(1);
  });

  it('merges creator, issued-asset, and controller registries and cleans shrunk arrays', () => {
    const runtime = loadRuntimeConfig({ INDEXER_NETWORK: 'lukso-mainnet' });
    const creatorIndex = `${DATA_KEYS.lsp4CreatorsIndex}${toHex(0n, { size: 16 }).slice(2)}`;
    const creatorMap = `${DATA_KEYS.lsp4CreatorsMap}${alice.slice(2)}`;
    const issuedIndex = `${DATA_KEYS.lsp12IssuedAssetsIndex}${toHex(0n, { size: 16 }).slice(2)}`;
    const controllerIndex = `${DATA_KEYS.lsp6ControllersIndex}${toHex(0n, { size: 16 }).slice(2)}`;
    const allowedCallsKey = `${DATA_KEYS.lsp6AllowedCalls}${controller.slice(2)}`;
    const registryValue = `0x24871b3d${toHex(0n, { size: 16 }).slice(2)}`;
    const allowedCall = toHex(123n, { size: 32 });
    const changes = [
      dataChanged(runtime, 1, asset, creatorIndex, alice),
      dataChanged(runtime, 2, asset, creatorMap, registryValue),
      dataChanged(runtime, 3, bob, issuedIndex, asset),
      dataChanged(runtime, 4, bob, controllerIndex, controller),
      dataChanged(runtime, 5, bob, allowedCallsKey, `0x0020${allowedCall.slice(2)}`),
    ];
    const state = emptyState();
    const first = reduceProjectionEvents(
      runtime,
      state,
      changes,
      verifications(changes, [alice, bob], new Map([[asset, 'lsp8']])),
    );

    expect(first.creators).toEqual([
      expect.objectContaining({
        assetAddress: asset,
        creatorAddress: alice,
        arrayIndex: 0n,
        interfaceId: '0x24871b3d',
        verified: true,
      }),
    ]);
    expect(first.issuedAssets).toEqual([
      expect.objectContaining({ issuerAddress: bob, assetAddress: asset, arrayIndex: 0n }),
    ]);
    expect(first.controllers).toEqual([
      expect.objectContaining({
        profileAddress: bob,
        controllerAddress: controller,
        arrayIndex: 0n,
        allowedCalls: [allowedCall],
      }),
    ]);

    const shrink = dataChanged(
      runtime,
      6,
      asset,
      DATA_KEYS.lsp4CreatorsLength,
      toHex(0n, { size: 16 }),
    );
    const second = reduceProjectionEvents(
      runtime,
      state,
      [shrink],
      verifications([shrink], [], new Map([[asset, 'lsp8']])),
    );
    expect(second.creators).toEqual([]);
    expect(second.deletedCreatorIds).toHaveLength(1);
  });

  it('keeps follower tombstones and applies block-pinned Chillwhales claim transitions', () => {
    const runtime = loadRuntimeConfig({ INDEXER_NETWORK: 'lukso-mainnet' });
    const follow = event(runtime, 1, 0, {
      address: '0xf01103e5a9909fc0dbe8166da7085e0285daddca',
      eventName: 'Follow',
      eventDomain: 'lsp26',
      decoded: { followerAddress: alice, followedAddress: bob },
    });
    const unfollow = event(runtime, 2, 0, {
      address: '0xf01103e5a9909fc0dbe8166da7085e0285daddca',
      eventName: 'Unfollow',
      eventDomain: 'lsp26',
      decoded: { followerAddress: alice, unfollowedAddress: bob },
    });
    const mint = transfer(
      runtime,
      3,
      CHILLWHALES_EXTENSION.collectionAddress,
      'lsp8',
      ZERO_ADDRESS,
      alice,
      '1',
    );
    const events = [follow, unfollow, mint];
    const headHash = toHex(4n, { size: 32 });
    const mutations = reduceProjectionEvents(
      runtime,
      emptyState(),
      events,
      verifications(
        events,
        [alice, bob],
        new Map([[CHILLWHALES_EXTENSION.collectionAddress, 'lsp8']]),
      ),
      [
        {
          address: CHILLWHALES_EXTENSION.collectionAddress,
          tokenId,
          chillClaimed: true,
          orbsClaimed: false,
          blockNumber: 4,
          blockHash: headHash,
          nextCheckBlock: 724,
        },
      ],
    );

    expect(mutations.followerEdges).toEqual([
      expect.objectContaining({
        followerAddress: alice,
        followedAddress: bob,
        isFollowing: false,
        unfollowedAt: unfollow.blockTimestamp,
      }),
    ]);
    expect(mutations.chillwhalesNfts).toEqual([
      expect.objectContaining({
        tokenId,
        chillClaimed: true,
        orbsClaimed: false,
        lastBlockNumber: 4,
        lastBlockHash: headHash,
        claimCheckAfterBlock: 724,
        lastTransactionHash: null,
      }),
    ]);
  });

  it('updates UP and digital-asset ownership without inventing the other domain', () => {
    const runtime = loadRuntimeConfig({ INDEXER_NETWORK: 'lukso-mainnet' });
    const profileOwnership = event(runtime, 1, 0, {
      address: alice,
      eventName: 'OwnershipTransferred',
      eventDomain: 'lsp14',
      decoded: { previousOwner: ZERO_ADDRESS, newOwner: bob },
    });
    const assetOwnership = event(runtime, 2, 0, {
      address: asset,
      eventName: 'OwnershipTransferred',
      eventDomain: 'lsp14',
      decoded: { previousOwner: ZERO_ADDRESS, newOwner: bob },
    });
    const state = emptyState();
    const mutations = reduceProjectionEvents(
      runtime,
      state,
      [profileOwnership, assetOwnership],
      verifications([profileOwnership, assetOwnership], [alice, bob], new Map([[asset, 'lsp7']])),
    );

    expect(mutations.universalProfiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ address: alice, ownerAddress: bob }),
        expect.objectContaining({ address: bob, ownerAddress: null }),
      ]),
    );
    expect(mutations.digitalAssets).toEqual([
      expect.objectContaining({ address: asset, ownerAddress: bob }),
    ]);
    expect(state.digitalAssets.has(alice)).toBe(false);
    expect(state.universalProfiles.has(asset)).toBe(false);
  });

  it('projects Orb defaults and token-scoped level, cooldown, and faction updates', () => {
    const runtime = loadRuntimeConfig({ INDEXER_NETWORK: 'lukso-mainnet' });
    const mint = transfer(
      runtime,
      1,
      CHILLWHALES_EXTENSION.orbsAddress,
      'lsp8',
      ZERO_ADDRESS,
      alice,
      '1',
    );
    const level = event(runtime, 2, 0, {
      address: CHILLWHALES_EXTENSION.orbsAddress,
      eventName: 'TokenIdDataChanged',
      eventDomain: 'lsp8',
      decoded: {
        tokenId,
        dataKey: CHILLWHALES_EXTENSION.orbLevelKey,
        dataValue: '0x0000000200000003',
      },
    });
    const faction = event(runtime, 3, 0, {
      address: CHILLWHALES_EXTENSION.orbsAddress,
      eventName: 'TokenIdDataChanged',
      eventDomain: 'lsp8',
      decoded: {
        tokenId,
        dataKey: CHILLWHALES_EXTENSION.orbFactionKey,
        dataValue: stringToHex('Fire'),
      },
    });
    const events = [faction, mint, level];
    const mutations = reduceProjectionEvents(
      runtime,
      emptyState(),
      events,
      verifications(events, [alice], new Map([[CHILLWHALES_EXTENSION.orbsAddress, 'lsp8']])),
    );

    expect(mutations.chillwhalesNfts).toEqual([
      expect.objectContaining({
        address: CHILLWHALES_EXTENSION.orbsAddress,
        tokenId,
        level: 2,
        cooldownExpiry: 3,
        faction: 'Fire',
      }),
    ]);
    expect(mutations.dataValues).toHaveLength(2);
  });

  it('decodes all scalar asset and controller value families while preserving raw values', () => {
    const runtime = loadRuntimeConfig({ INDEXER_NETWORK: 'lukso-mainnet' });
    const permissionsKey = `${DATA_KEYS.lsp6Permissions}${controller.slice(2)}`;
    const allowedDataKeysKey = `${DATA_KEYS.lsp6AllowedDataKeys}${controller.slice(2)}`;
    const allowedDataKey = toHex(123n, { size: 32 });
    const changes = [
      dataChanged(runtime, 1, asset, DATA_KEYS.lsp4TokenName, stringToHex('Token')),
      dataChanged(runtime, 2, asset, DATA_KEYS.lsp4TokenSymbol, stringToHex('TKN')),
      dataChanged(runtime, 3, asset, DATA_KEYS.lsp4TokenType, '0x02'),
      dataChanged(runtime, 4, asset, DATA_KEYS.lsp8ReferenceContract, bob),
      dataChanged(runtime, 5, alice, permissionsKey, toHex(1n, { size: 32 })),
      dataChanged(runtime, 6, alice, allowedDataKeysKey, `0x0020${allowedDataKey.slice(2)}`),
    ];
    const mutations = reduceProjectionEvents(
      runtime,
      emptyState(),
      changes,
      verifications(changes, [alice], new Map([[asset, 'lsp8']])),
    );

    expect(mutations.digitalAssets).toEqual([
      expect.objectContaining({
        name: 'Token',
        symbol: 'TKN',
        tokenType: 2,
        tokenIdReferenceContract: bob,
      }),
    ]);
    expect(mutations.controllers).toEqual([
      expect.objectContaining({
        profileAddress: alice,
        controllerAddress: controller,
        permissions: toHex(1n, { size: 32 }),
        allowedDataKeys: [allowedDataKey],
      }),
    ]);
    expect(mutations.dataValues).toHaveLength(changes.length);
  });

  it('removes issued assets and controllers when their registries shrink', () => {
    const runtime = loadRuntimeConfig({ INDEXER_NETWORK: 'lukso-mainnet' });
    const issuedIndex = `${DATA_KEYS.lsp12IssuedAssetsIndex}${toHex(0n, { size: 16 }).slice(2)}`;
    const controllerIndex = `${DATA_KEYS.lsp6ControllersIndex}${toHex(0n, { size: 16 }).slice(2)}`;
    const setup = [
      dataChanged(runtime, 1, alice, issuedIndex, asset),
      dataChanged(runtime, 2, alice, controllerIndex, controller),
    ];
    const state = emptyState();
    reduceProjectionEvents(
      runtime,
      state,
      setup,
      verifications(setup, [alice], new Map([[asset, 'lsp7']])),
    );
    const shrink = [
      dataChanged(runtime, 3, alice, DATA_KEYS.lsp12IssuedAssetsLength, toHex(0n, { size: 16 })),
      dataChanged(runtime, 4, alice, DATA_KEYS.lsp6ControllersLength, toHex(0n, { size: 16 })),
    ];
    const mutations = reduceProjectionEvents(
      runtime,
      state,
      shrink,
      verifications(shrink, [alice], new Map()),
    );

    expect(mutations.issuedAssets).toEqual([]);
    expect(mutations.controllers).toEqual([]);
    expect(mutations.deletedIssuedAssetIds).toHaveLength(1);
    expect(mutations.deletedControllerIds).toHaveLength(1);
  });
});
