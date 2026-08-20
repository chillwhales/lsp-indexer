import { encodeVerifiableUri, parseVerifiableUri } from '@chillwhales/lsp2';
import { computeContentHash, encodeLsp31Uri } from '@chillwhales/lsp31';
import { isHex, toBytes, toHex } from 'viem';
import { describe, expect, it } from 'vitest';
import { loadRuntimeConfig } from '../../config/index.js';
import { dataValues, metadataJobs, nfts } from '../../db/schema.js';
import type { EventFactRecord } from '../../events/decode.js';
import type { ProjectionMutations } from '../../projections/reducer.js';
import { DATA_KEYS, ZERO_ADDRESS } from '../../projections/standards.js';
import type { ProjectionState } from '../../projections/state.js';
import {
  createDataValueMetadataSource,
  createNftMetadataSource,
  matchesMetadataJob,
  planMetadataSources,
} from '../source.js';

type DataValueRow = typeof dataValues.$inferSelect;
type MetadataJobRow = typeof metadataJobs.$inferSelect;
type NftRow = typeof nfts.$inferSelect;

const runtime = loadRuntimeConfig({ INDEXER_NETWORK: 'lukso-mainnet' });
const profile = '0x0000000000000000000000000000000000000010';
const asset = '0x0000000000000000000000000000000000000020';
const tokenId = toHex(42n, { size: 32 });
const blockHash = toHex(100n, { size: 32 });
const transactionHash = toHex(200n, { size: 32 });
const profileContent = { LSP3Profile: { name: 'Alice' } };

function createDataValue(overrides: Partial<DataValueRow> = {}): DataValueRow {
  return {
    id: 'data-value-id',
    network: runtime.network.key,
    chainId: runtime.network.chainId,
    address: profile,
    tokenId: null,
    dataKey: DATA_KEYS.lsp3Profile,
    dataValue: encodeVerifiableUri(profileContent, 'ipfs://profile'),
    lastBlockNumber: 100,
    lastBlockHash: blockHash,
    lastTransactionHash: transactionHash,
    lastTransactionIndex: 1,
    lastLogIndex: 2,
    ...overrides,
  };
}

function createNft(overrides: Partial<NftRow> = {}): NftRow {
  return {
    id: 'nft-id',
    network: runtime.network.key,
    chainId: runtime.network.chainId,
    address: asset,
    tokenId,
    formattedTokenId: '42',
    isMinted: true,
    isBurned: false,
    ownerAddress: profile,
    tokenUri: 'ipfs://collection/42',
    verification: 'verified',
    lastBlockNumber: 100,
    lastBlockHash: blockHash,
    lastTransactionHash: transactionHash,
    lastTransactionIndex: 1,
    lastLogIndex: 2,
    ...overrides,
  };
}

function createState(): ProjectionState {
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

function createMutations(overrides: Partial<ProjectionMutations> = {}): ProjectionMutations {
  return {
    universalProfiles: [],
    digitalAssets: [],
    nfts: [],
    ownedAssets: [],
    ownedTokens: [],
    followerEdges: [],
    creators: [],
    issuedAssets: [],
    controllers: [],
    chillwhalesNfts: [],
    dataValues: [],
    deletedOwnedAssetIds: [],
    deletedOwnedTokenIds: [],
    deletedCreatorIds: [],
    deletedIssuedAssetIds: [],
    deletedControllerIds: [],
    ...overrides,
  };
}

function createEvent(overrides: Partial<EventFactRecord> = {}): EventFactRecord {
  return {
    id: 'event-id',
    network: runtime.network.key,
    chainId: runtime.network.chainId,
    blockNumber: 100,
    blockHash,
    parentHash: toHex(99n, { size: 32 }),
    blockTimestamp: new Date('2026-01-01T00:00:00Z'),
    transactionHash,
    transactionIndex: 1,
    logIndex: 2,
    address: asset,
    topic0: toHex(1n, { size: 32 }),
    topics: [toHex(1n, { size: 32 })],
    data: '0x',
    eventName: 'Transfer',
    eventDomain: 'lsp8',
    decoded: { from: ZERO_ADDRESS, to: profile, tokenId, force: true, data: '0x' },
    ...overrides,
  };
}

function createJob(
  source: NonNullable<ReturnType<typeof createDataValueMetadataSource>>,
): MetadataJobRow {
  const now = new Date('2026-01-01T00:00:00Z');
  return {
    id: source.id,
    network: source.network,
    chainId: source.chainId,
    kind: source.kind,
    status: 'processing',
    address: source.address,
    tokenId: source.tokenId,
    dataKey: source.dataKey,
    sourceRevision: source.sourceRevision,
    contentUri: source.contentUri,
    contentHash: source.contentHash,
    sourceBlockNumber: source.lastBlockNumber,
    sourceBlockHash: source.lastBlockHash,
    attempts: 1,
    nextAttemptAt: now,
    claimedAt: now,
    lastError: null,
    createdAt: now,
    updatedAt: now,
  };
}

describe('metadata source planning', () => {
  it('parses a verifiable profile URI with deterministic provenance', () => {
    const row = createDataValue();
    const source = createDataValueMetadataSource(runtime, row);
    if (!isHex(row.dataValue)) throw new Error('Expected hex data-value fixture');
    const parsed = parseVerifiableUri(row.dataValue);

    expect(source).toMatchObject({
      network: 'lukso-mainnet',
      chainId: 42,
      kind: 'lsp3_profile',
      address: profile,
      tokenId: null,
      dataKey: DATA_KEYS.lsp3Profile,
      contentUri: 'ipfs://profile',
      contentHash: parsed.verificationData,
      verificationMethod: parsed.verificationMethod,
      lastBlockNumber: 100,
      lastBlockHash: blockHash,
      lastTransactionHash: transactionHash,
    });
    expect(source?.id).toContain('metadata-revision');
  });

  it('supports contract, token, encrypted, and derived metadata source kinds', () => {
    const lsp4Asset = createDataValue({
      address: asset,
      dataKey: DATA_KEYS.lsp4Metadata,
      dataValue: encodeVerifiableUri(
        { LSP4Metadata: { name: 'Collection' } },
        'https://example.com/a',
      ),
    });
    const lsp4Token = createDataValue({
      address: asset,
      tokenId,
      dataKey: DATA_KEYS.lsp4Metadata,
      dataValue: encodeVerifiableUri({ LSP4Metadata: { name: 'Token' } }, 'ipfs://token'),
    });
    const encryptedValue = encodeLsp31Uri(
      [
        { backend: 'ipfs', cid: 'bafy-metadata' },
        { backend: 'arweave', transactionId: 'arweave-metadata' },
      ],
      computeContentHash(toBytes('encrypted metadata')),
    );
    const encrypted = createDataValue({
      dataKey: DATA_KEYS.lsp29EncryptedAssetsIndex.padEnd(66, '0'),
      dataValue: encryptedValue,
    });

    expect(createDataValueMetadataSource(runtime, lsp4Asset)?.kind).toBe('lsp4_asset');
    expect(createDataValueMetadataSource(runtime, lsp4Token)?.kind).toBe('lsp4_token');
    expect(createDataValueMetadataSource(runtime, encrypted)).toMatchObject({
      kind: 'lsp29_encrypted_asset',
      contentUri: 'ipfs://bafy-metadata',
    });
    expect(createNftMetadataSource(runtime, createNft())).toMatchObject({
      kind: 'lsp4_token',
      contentUri: 'ipfs://collection/42',
      contentHash: null,
      verificationMethod: null,
    });
  });

  it('ignores unrelated or empty values and rejects unsafe references', () => {
    expect(
      createDataValueMetadataSource(
        runtime,
        createDataValue({ dataKey: toHex(999n, { size: 32 }) }),
      ),
    ).toBeNull();
    expect(createDataValueMetadataSource(runtime, createDataValue({ dataValue: '0x' }))).toBeNull();
    expect(createNftMetadataSource(runtime, createNft({ tokenUri: null }))).toBeNull();
    expect(() =>
      createNftMetadataSource(runtime, createNft({ tokenUri: 'file:///tmp/metadata.json' })),
    ).toThrow('IPFS, HTTP, or HTTPS');

    const unsafe = encodeVerifiableUri(profileContent, 'https://user:password@example.com/profile');
    expect(() =>
      createDataValueMetadataSource(runtime, createDataValue({ dataValue: unsafe })),
    ).toThrow('must not contain credentials');
  });

  it('queues data-value sources only after their chain target is verified', () => {
    const row = createDataValue();
    const state = createState();
    const beforeVerification = planMetadataSources(
      runtime,
      state,
      createMutations({ dataValues: [row] }),
      [],
    );
    expect(beforeVerification.scopes).toHaveLength(1);
    expect(beforeVerification.sources).toEqual([]);

    state.universalProfiles.set(profile, {
      id: 'profile-id',
      network: runtime.network.key,
      chainId: runtime.network.chainId,
      address: profile,
      ownerAddress: null,
      verification: 'verified',
      lastBlockNumber: 100,
      lastBlockHash: blockHash,
      lastTransactionHash: transactionHash,
      lastTransactionIndex: 1,
      lastLogIndex: 2,
    });
    const verified = planMetadataSources(
      runtime,
      state,
      createMutations({ dataValues: [row] }),
      [],
    );
    expect(verified.sources).toHaveLength(1);
    expect(verified.rejected).toEqual([]);

    const currentProfile = state.universalProfiles.get(profile);
    if (currentProfile == null) throw new Error('Expected profile state fixture');
    state.universalProfiles.set(profile, { ...currentProfile, verification: 'invalid' });
    expect(
      planMetadataSources(runtime, state, createMutations({ dataValues: [row] }), []).sources,
    ).toEqual([]);
  });

  it('records invalid current sources so an older job can be cancelled', () => {
    const state = createState();
    state.universalProfiles.set(profile, {
      id: 'profile-id',
      network: runtime.network.key,
      chainId: runtime.network.chainId,
      address: profile,
      ownerAddress: null,
      verification: 'verified',
      lastBlockNumber: 100,
      lastBlockHash: blockHash,
      lastTransactionHash: transactionHash,
      lastTransactionIndex: 1,
      lastLogIndex: 2,
    });
    const plan = planMetadataSources(
      runtime,
      state,
      createMutations({ dataValues: [createDataValue({ dataValue: '0x1234' })] }),
      [],
    );

    expect(plan.scopes).toHaveLength(1);
    expect(plan.sources).toEqual([]);
    expect(plan.rejected[0]?.reason).toBeTruthy();
  });

  it('queues derived token URIs only for mints and URI derivation changes', () => {
    const nft = createNft();
    const mutations = createMutations({ nfts: [nft] });

    expect(
      planMetadataSources(runtime, createState(), mutations, [createEvent()]).sources,
    ).toHaveLength(1);
    expect(
      planMetadataSources(runtime, createState(), mutations, [
        createEvent({
          eventName: 'DataChanged',
          eventDomain: 'erc725y',
          decoded: { dataKey: DATA_KEYS.lsp8MetadataBaseUri, dataValue: '0x' },
        }),
      ]).sources,
    ).toHaveLength(1);
    expect(
      planMetadataSources(runtime, createState(), mutations, [
        createEvent({ decoded: { from: profile, to: asset, tokenId, force: true, data: '0x' } }),
      ]).scopes,
    ).toEqual([]);

    const invalid = planMetadataSources(
      runtime,
      createState(),
      createMutations({ nfts: [createNft({ verification: 'invalid' })] }),
      [createEvent()],
    );
    expect(invalid.scopes).toHaveLength(1);
    expect(invalid.sources).toEqual([]);
  });

  it('matches a claim only to its exact current natural source revision', () => {
    const source = createDataValueMetadataSource(runtime, createDataValue());
    if (source == null) throw new Error('Expected metadata source fixture');
    const job = createJob(source);

    expect(matchesMetadataJob(job, source)).toBe(true);
    expect(matchesMetadataJob({ ...job, contentUri: 'ipfs://old' }, source)).toBe(false);
    expect(matchesMetadataJob(job, null)).toBe(false);
  });
});
