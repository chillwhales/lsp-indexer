import { describe, expect, it } from 'vitest';

import { LSP4_METADATA_DATA_KEY, LSP8_METADATA_BASE_URI_DATA_KEY } from '../metadata-keys';
import {
  parseV3Block,
  parseV3ChillwhalesNft,
  parseV3Controller,
  parseV3Creator,
  parseV3DataValue,
  parseV3DigitalAsset,
  parseV3EventFact,
  parseV3Follower,
  parseV3IndexedHead,
  parseV3IssuedAsset,
  parseV3MetadataRevision,
  parseV3Nft,
  parseV3OwnedAsset,
  parseV3OwnedToken,
  parseV3Rows,
  parseV3UniversalProfile,
} from '../parsers';
import {
  parseCreator,
  parseDataChangedEvent,
  parseDigitalAsset,
  parseEncryptedAsset,
  parseFollower,
  parseIssuedAsset,
  parseNft,
  parseOwnedAsset,
  parseOwnedToken,
  parseProfile,
  parseTokenIdDataChangedEvent,
  parseUniversalReceiverEvent,
} from '../rich-parsers';
import {
  ADDRESS,
  HASH,
  TOKEN_ID,
  creatorRow,
  digitalAssetRow,
  directRows,
  eventRow,
  followerRow,
  issuedAssetRow,
  metadataRevisionRow,
  nftRow,
  ownedAssetRow,
  ownedTokenRow,
  profileRow,
} from './fixtures';

const parserCases = [
  ['blocks', parseV3Block, directRows.blocks],
  ['events', parseV3EventFact, directRows.events],
  ['profiles', parseV3UniversalProfile, directRows.profiles],
  ['digitalAssets', parseV3DigitalAsset, directRows.digitalAssets],
  ['nfts', parseV3Nft, directRows.nfts],
  ['ownedAssets', parseV3OwnedAsset, directRows.ownedAssets],
  ['ownedTokens', parseV3OwnedToken, directRows.ownedTokens],
  ['followers', parseV3Follower, directRows.followers],
  ['creators', parseV3Creator, directRows.creators],
  ['issuedAssets', parseV3IssuedAsset, directRows.issuedAssets],
  ['controllers', parseV3Controller, directRows.controllers],
  ['chillwhalesNfts', parseV3ChillwhalesNft, directRows.chillwhalesNfts],
  ['dataValues', parseV3DataValue, directRows.dataValues],
  ['metadataRevisions', parseV3MetadataRevision, directRows.metadataRevisions],
  ['indexedHeads', parseV3IndexedHead, directRows.indexedHeads],
] as const;

describe('v3 transport parsers', () => {
  it.each(parserCases)('parses the %s API domain', (_domain, parser, row) => {
    expect(parser(row)).toMatchObject({ network: 'lukso-mainnet', chainId: 42 });
  });

  it('preserves bigint precision and normalizes addresses and timestamps', () => {
    const asset = parseV3DigitalAsset({
      ...digitalAssetRow,
      address: ADDRESS.toUpperCase().replace('0X', '0x'),
      totalSupply: '9007199254740993123456789',
    });
    expect(asset.address).toBe(ADDRESS);
    expect(asset.totalSupply).toBe(9_007_199_254_740_993_123_456_789n);
    expect(parseV3Block(directRows.blocks).timestamp).toBe('2026-08-24T12:00:00.000Z');
    expect(() => parseV3Block({ ...directRows.blocks, timestamp: '2026-08-24' })).toThrow(
      /timestamp/,
    );
  });

  it('supports nullable projection fields without accepting missing invariants', () => {
    const profile = parseV3UniversalProfile({
      ...profileRow,
      ownerAddress: null,
      lastTransactionHash: null,
      lastTransactionIndex: null,
      lastLogIndex: null,
    });
    expect(profile.ownerAddress).toBeNull();
    expect(() => parseV3UniversalProfile({ ...profileRow, chainId: null })).toThrow();
    expect(() => parseV3Block({ ...directRows.blocks, number: '' })).toThrow();
    expect(() =>
      parseV3OwnedAsset({ ...ownedAssetRow, balance: Number.MAX_SAFE_INTEGER + 1 }),
    ).toThrow(/lossless/);
    expect(parseV3Controller({ ...directRows.controllers, arrayIndex: null })).toMatchObject({
      arrayIndex: null,
    });
  });

  it('parses row arrays and rejects non-array envelopes', () => {
    expect(parseV3Rows([profileRow], parseV3UniversalProfile)).toHaveLength(1);
    expect(() => parseV3Rows(profileRow, parseV3UniversalProfile)).toThrow(/array/);
  });
});

describe('familiar v3 parsers', () => {
  it('retains familiar full result shapes with v3 provenance', () => {
    expect(parseProfile(profileRow)).toMatchObject({
      address: ADDRESS,
      name: 'Alice',
      followerCount: 2,
      network: 'lukso-mainnet',
      lastBlockHash: HASH,
    });
    expect(parseDigitalAsset(digitalAssetRow)).toMatchObject({
      name: 'Token',
      standard: 'LSP7',
      totalSupply: 900_719_925_474_099_300_000n,
    });
    expect(parseNft(nftRow)).toMatchObject({ name: 'NFT', tokenId: TOKEN_ID, level: 2 });
    expect(parseOwnedAsset(ownedAssetRow)).toMatchObject({
      holderAddress: ADDRESS,
      balance: 1_000_000_000_000_000_000n,
      tokenIdCount: 1,
    });
    expect(parseOwnedToken(ownedTokenRow)).toMatchObject({ tokenId: TOKEN_ID });
    expect(parseFollower(followerRow)).toMatchObject({ isFollowing: true });
    expect(parseCreator(creatorRow)).toMatchObject({ creatorAddress: ADDRESS, arrayIndex: 0 });
    expect(parseIssuedAsset(issuedAssetRow)).toMatchObject({ issuerAddress: ADDRESS });
    expect(parseEncryptedAsset(metadataRevisionRow)).toMatchObject({
      contentId: 'content',
      file: { name: 'secret.txt', size: 123 },
    });
  });

  it('prefers direct NFT metadata over the base-URI fallback', () => {
    const direct = {
      dataKey: LSP4_METADATA_DATA_KEY,
      content: { LSP4Metadata: { name: 'Direct metadata' } },
    };
    const baseUri = {
      dataKey: LSP8_METADATA_BASE_URI_DATA_KEY,
      content: { LSP4Metadata: { name: 'Base URI metadata' } },
    };

    expect(parseNft({ ...nftRow, metadataRevisions: [baseUri, direct] }).name).toBe(
      'Direct metadata',
    );
    expect(parseNft({ ...nftRow, metadataRevisions: [baseUri] }).name).toBe('Base URI metadata');
  });

  it('strips excluded scalar and nested fields at runtime', () => {
    const profile = parseProfile(profileRow, { name: true });
    expect(profile).toHaveProperty('name', 'Alice');
    expect(profile).not.toHaveProperty('description');

    const asset = parseDigitalAsset(digitalAssetRow, { decimals: true });
    expect(asset).toMatchObject({ decimals: 18, standard: 'LSP7' });
    expect(asset).not.toHaveProperty('name');

    const nft = parseNft(nftRow, { holder: { name: true }, collection: { symbol: true } });
    expect(nft.holder).toMatchObject({ address: ADDRESS, name: 'Alice', timestamp: null });
    expect(nft.holder).not.toHaveProperty('description');
    expect(nft.collection).toMatchObject({ symbol: 'TKN' });
    expect(nft.collection).not.toHaveProperty('name');

    const encrypted = parseEncryptedAsset(metadataRevisionRow, {
      file: { size: true },
      encryption: { provider: true },
    });
    expect(encrypted.file).toEqual({ name: 'secret.txt', size: 123 });
    expect(encrypted.encryption).toEqual({ provider: 'lit' });
    expect(encrypted).not.toHaveProperty('title');
  });

  it('parses familiar event payloads and rejects malformed decoded data', () => {
    expect(parseDataChangedEvent(eventRow)).toMatchObject({ dataKey: HASH, dataValue: '0x1234' });
    expect(
      parseTokenIdDataChangedEvent({
        ...eventRow,
        eventName: 'TokenIdDataChanged',
        decoded: { dataKey: HASH, dataValue: '0x1234', tokenId: TOKEN_ID },
      }),
    ).toMatchObject({ tokenId: TOKEN_ID });
    expect(
      parseUniversalReceiverEvent({
        ...eventRow,
        eventName: 'UniversalReceiver',
        decoded: {
          from: ADDRESS,
          typeId: HASH,
          value: '1000000000000000000',
          receivedData: '0x',
          returnedValue: '0x',
        },
      }),
    ).toMatchObject({ from: ADDRESS, value: 1_000_000_000_000_000_000n });
    expect(() => parseDataChangedEvent({ ...eventRow, decoded: null })).toThrow();
  });
});
