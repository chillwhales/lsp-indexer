import { describe, expect, it } from 'vitest';
import {
  parseCreator,
  parseCreators,
  parseDataChangedEvent,
  parseDataChangedEvents,
  parseDigitalAsset,
  parseDigitalAssets,
  parseEncryptedAsset,
  parseEncryptedAssets,
  parseFollower,
  parseFollowers,
  parseIssuedAsset,
  parseIssuedAssets,
  parseNft,
  parseNfts,
  parseOwnedAsset,
  parseOwnedAssets,
  parseOwnedToken,
  parseOwnedTokens,
  parseProfile,
  parseProfiles,
  parseTokenIdDataChangedEvent,
  parseTokenIdDataChangedEvents,
  parseUniversalReceiverEvent,
  parseUniversalReceiverEvents,
} from '../rich-parsers';
import {
  HASH,
  OTHER_ADDRESS,
  TOKEN_ID,
  creatorRow,
  digitalAssetRow,
  eventRow,
  followerRow,
  issuedAssetRow,
  metadataRevisionRow,
  nftRow,
  ownedAssetRow,
  ownedTokenRow,
  profileRow,
} from './fixtures';

const tokenEventRow = {
  ...eventRow,
  decoded: { dataKey: HASH, dataValue: '0x1234', tokenId: TOKEN_ID },
};
const receiverEventRow = {
  ...eventRow,
  decoded: {
    from: OTHER_ADDRESS,
    typeId: HASH,
    value: null,
    receivedData: null,
    returnedValue: null,
  },
};

describe('familiar v3 parser edge cases', () => {
  it('supports minimal rows with absent metadata and nullable relations', () => {
    const minimalProfile = {
      ...profileRow,
      metadataRevisions: null,
      followerCount: null,
      followingCount: null,
    };
    expect(parseProfile(minimalProfile)).toMatchObject({
      name: null,
      followerCount: 0,
      followingCount: 0,
    });

    const minimalAsset = {
      ...digitalAssetRow,
      standard: 'lsp8',
      tokenType: 1,
      name: null,
      symbol: null,
      tokenIdFormat: 2,
      metadataRevisions: [],
      holderCount: null,
      creatorCount: null,
    };
    expect(parseDigitalAsset(minimalAsset)).toMatchObject({
      standard: 'LSP8',
      tokenType: 'NFT',
      name: null,
      tokenIdFormat: '2',
    });
    expect(parseDigitalAsset({ ...minimalAsset, standard: 'unknown', tokenType: 2 })).toMatchObject(
      { standard: 'UNKNOWN', tokenType: 'COLLECTION' },
    );
    expect(parseDigitalAsset({ ...minimalAsset, tokenType: null })).toHaveProperty(
      'tokenType',
      null,
    );

    expect(
      parseNft({
        ...nftRow,
        metadataRevisions: null,
        digitalAsset: null,
        ownedToken: null,
        chillwhales: null,
      }),
    ).toMatchObject({ collection: null, holder: null, chillClaimed: null });
    expect(
      parseOwnedAsset({
        ...ownedAssetRow,
        digitalAsset: null,
        universalProfile: null,
        tokenIdCount: null,
      }),
    ).toMatchObject({ digitalAsset: null, holder: null, tokenIdCount: 0 });
    expect(
      parseOwnedToken({
        ...ownedTokenRow,
        digitalAsset: null,
        nft: null,
        ownedAsset: null,
        universalProfile: null,
      }),
    ).toMatchObject({ digitalAsset: null, nft: null, ownedAsset: null, holder: null });
    expect(
      parseFollower({ ...followerRow, followerProfile: null, followedProfile: null }),
    ).toMatchObject({ followerProfile: null, followedProfile: null });
    expect(parseCreator({ ...creatorRow, creatorProfile: null, digitalAsset: null })).toMatchObject(
      { creatorProfile: null, digitalAsset: null },
    );
    expect(
      parseIssuedAsset({ ...issuedAssetRow, issuerProfile: null, digitalAsset: null }),
    ).toMatchObject({ issuerProfile: null, digitalAsset: null });
  });

  it('filters malformed optional metadata entries without rejecting the domain row', () => {
    const parsed = parseDigitalAsset({
      ...digitalAssetRow,
      name: null,
      symbol: null,
      metadataRevisions: [
        {
          content: {
            LSP4Metadata: {
              name: 'Metadata name',
              symbol: 'META',
              icon: [{ width: 1 }, { url: 'ipfs://icon', width: '32', height: Infinity }],
              images: [null, [{ nope: true }], { url: 'ipfs://flat' }],
              links: [
                null,
                { title: 'missing URL' },
                { title: 'Site', url: 'https://example.com' },
              ],
              attributes: [
                null,
                { key: 'missing fields' },
                { key: 'level', value: '2', type: 'number', score: '1.5', rarity: 'bad' },
              ],
            },
          },
        },
      ],
    });
    expect(parsed).toMatchObject({ name: 'Metadata name', symbol: 'META' });
    expect(parsed.icons).toHaveLength(1);
    expect(parsed.images).toHaveLength(1);
    expect(parsed.links).toHaveLength(1);
    expect(parsed.attributes).toHaveLength(1);
  });

  it('exercises every list parser and partial include path', () => {
    expect(parseProfiles([profileRow], {})).toHaveLength(1);
    expect(parseDigitalAssets([digitalAssetRow], {})).toHaveLength(1);
    expect(parseNfts([nftRow], {})).toHaveLength(1);
    expect(parseOwnedAssets([ownedAssetRow], {})).toHaveLength(1);
    expect(parseOwnedTokens([ownedTokenRow], {})).toHaveLength(1);
    expect(parseFollowers([followerRow], {})).toHaveLength(1);
    expect(parseCreators([creatorRow], {})).toHaveLength(1);
    expect(parseIssuedAssets([issuedAssetRow], {})).toHaveLength(1);
    expect(parseDataChangedEvents([eventRow], {})).toHaveLength(1);
    expect(parseTokenIdDataChangedEvents([tokenEventRow], {})).toHaveLength(1);
    expect(parseUniversalReceiverEvents([receiverEventRow], {})).toHaveLength(1);
    expect(parseEncryptedAssets([metadataRevisionRow], {})).toHaveLength(1);

    expect(
      parseDataChangedEvent({ ...eventRow, universalProfile: null, digitalAsset: null }),
    ).toMatchObject({ universalProfile: null, digitalAsset: null });
    expect(parseTokenIdDataChangedEvent({ ...tokenEventRow, digitalAsset: null })).toHaveProperty(
      'digitalAsset',
      null,
    );
    expect(parseUniversalReceiverEvent(receiverEventRow)).toMatchObject({
      value: null,
      universalProfile: expect.any(Object),
    });
  });

  it('rejects malformed decoded events and lossy familiar array indexes', () => {
    expect(() => parseDataChangedEvent({ ...eventRow, decoded: { dataKey: null } })).toThrow(
      /malformed/,
    );
    expect(() =>
      parseTokenIdDataChangedEvent({ ...tokenEventRow, decoded: { dataKey: HASH } }),
    ).toThrow(/malformed/);
    expect(() =>
      parseUniversalReceiverEvent({ ...receiverEventRow, decoded: { from: null, typeId: null } }),
    ).toThrow(/malformed/);
    expect(() => parseCreator({ ...creatorRow, arrayIndex: '9007199254740992' })).toThrow(
      /safe integer range/,
    );
    expect(() => parseIssuedAsset({ ...issuedAssetRow, arrayIndex: '9007199254740992' })).toThrow(
      /safe integer range/,
    );
  });

  it('parses encrypted metadata with nullable and JSON-encoded branches', () => {
    expect(
      parseEncryptedAsset({
        ...metadataRevisionRow,
        content: {},
        universalProfile: null,
      }),
    ).toMatchObject({ encryption: null, file: null, chunks: null, universalProfile: null });

    const content = metadataRevisionRow.content.LSP29EncryptedAsset;
    expect(
      parseEncryptedAsset({
        ...metadataRevisionRow,
        content: {
          LSP29EncryptedAsset: {
            ...content,
            encryption: {
              ...content.encryption,
              condition: { type: 'ownership' },
              encryptedKey: { ciphertext: 'secret' },
              params: {
                ...content.encryption.params,
                followedAddresses: [OTHER_ADDRESS],
                unlockTimestamp: '2027-01-01T00:00:00.000Z',
              },
            },
            file: null,
            chunks: null,
          },
        },
      }),
    ).toMatchObject({
      encryption: {
        condition: JSON.stringify({ type: 'ownership' }),
        encryptedKey: JSON.stringify({ ciphertext: 'secret' }),
      },
      file: null,
      chunks: null,
    });
  });
});
