import { describe, expect, it } from 'vitest';

import {
  // common
  AssetSchema,
  // creators
  CreatorFilterSchema,
  CreatorIncludeSchema,
  CreatorSchema,
  CreatorSortFieldSchema,
  CreatorSortSchema,
  // data-changed-events
  DataChangedEventFilterSchema,
  DataChangedEventIncludeSchema,
  DataChangedEventSchema,
  DataChangedEventSortFieldSchema,
  DataChangedEventSortSchema,
  // digital-assets
  DigitalAssetFilterSchema,
  DigitalAssetIncludeSchema,
  DigitalAssetOwnerSchema,
  DigitalAssetSchema,
  DigitalAssetSortFieldSchema,
  DigitalAssetSortSchema,
  // encrypted-assets
  EncryptedAssetFilterSchema,
  EncryptedAssetIncludeSchema,
  EncryptedAssetSchema,
  EncryptedAssetSortFieldSchema,
  EncryptedAssetSortSchema,
  FollowCountSchema,
  // followers
  FollowerFilterSchema,
  FollowerIncludeSchema,
  FollowerSchema,
  FollowerSortFieldSchema,
  FollowerSortSchema,
  ImageSchema,
  // issued-assets
  IssuedAssetFilterSchema,
  IssuedAssetIncludeSchema,
  IssuedAssetSchema,
  IssuedAssetSortFieldSchema,
  IssuedAssetSortSchema,
  LinkSchema,
  Lsp4AttributeSchema,
  // nfts
  NftFilterSchema,
  NftIncludeSchema,
  NftSchema,
  NftSortFieldSchema,
  NftSortSchema,
  // owned-assets
  OwnedAssetFilterSchema,
  OwnedAssetIncludeSchema,
  OwnedAssetSchema,
  OwnedAssetSortFieldSchema,
  OwnedAssetSortSchema,
  // owned-tokens
  OwnedTokenFilterSchema,
  OwnedTokenIncludeSchema,
  OwnedTokenSchema,
  OwnedTokenSortFieldSchema,
  OwnedTokenSortSchema,
  // profiles
  ProfileFilterSchema,
  ProfileIncludeSchema,
  ProfileSchema,
  ProfileSortFieldSchema,
  ProfileSortSchema,
  SortDirectionSchema,
  SortNullsSchema,
  StandardSchema,
  // token-id-data-changed-events
  TokenIdDataChangedEventFilterSchema,
  TokenIdDataChangedEventIncludeSchema,
  TokenIdDataChangedEventSchema,
  TokenIdDataChangedEventSortFieldSchema,
  TokenIdDataChangedEventSortSchema,
  TokenTypeSchema,
  // universal-receiver-events
  UniversalReceiverEventFilterSchema,
  UniversalReceiverEventIncludeSchema,
  UniversalReceiverEventSchema,
  UniversalReceiverEventSortFieldSchema,
  UniversalReceiverEventSortSchema,
  UseCreatorsParamsSchema,
  UseDataChangedEventsParamsSchema,
  UseDigitalAssetParamsSchema,
  UseDigitalAssetsParamsSchema,
  UseEncryptedAssetsParamsSchema,
  UseFollowCountParamsSchema,
  UseFollowsParamsSchema,
  UseInfiniteCreatorsParamsSchema,
  UseInfiniteDataChangedEventsParamsSchema,
  UseInfiniteDigitalAssetsParamsSchema,
  UseInfiniteEncryptedAssetsParamsSchema,
  UseInfiniteFollowsParamsSchema,
  UseInfiniteIssuedAssetsParamsSchema,
  UseInfiniteNftsParamsSchema,
  UseInfiniteOwnedAssetsParamsSchema,
  UseInfiniteOwnedTokensParamsSchema,
  UseInfiniteProfilesParamsSchema,
  UseInfiniteTokenIdDataChangedEventsParamsSchema,
  UseInfiniteUniversalReceiverEventsParamsSchema,
  UseIsFollowingParamsSchema,
  UseIssuedAssetsParamsSchema,
  UseNftParamsSchema,
  UseNftsParamsSchema,
  UseOwnedAssetsParamsSchema,
  UseOwnedTokensParamsSchema,
  UseProfileParamsSchema,
  UseProfilesParamsSchema,
  UseTokenIdDataChangedEventsParamsSchema,
  UseUniversalReceiverEventsParamsSchema,
  // errors
  type IndexerErrorCategory,
  type IndexerErrorCode,
  // subscriptions
  type SubscriptionHookOptions,
  type UseSubscriptionReturn,
} from '../index';

describe('@lsp-indexer/types', () => {
  describe('common schemas', () => {
    it('exports SortDirectionSchema', () => {
      expect(SortDirectionSchema).toBeDefined();
      expect(SortDirectionSchema.parse('asc')).toBe('asc');
      expect(SortDirectionSchema.parse('desc')).toBe('desc');
    });

    it('exports SortNullsSchema', () => {
      expect(SortNullsSchema).toBeDefined();
      expect(SortNullsSchema.parse('first')).toBe('first');
      expect(SortNullsSchema.parse('last')).toBe('last');
    });

    it('exports ImageSchema', () => {
      expect(ImageSchema).toBeDefined();
      const img = ImageSchema.parse({
        url: 'https://example.com/img.png',
        width: 100,
        height: 100,
        verification: null,
      });
      expect(img.url).toBe('https://example.com/img.png');
    });

    it('exports LinkSchema', () => {
      expect(LinkSchema).toBeDefined();
      const link = LinkSchema.parse({ title: 'Website', url: 'https://example.com' });
      expect(link.title).toBe('Website');
    });

    it('exports AssetSchema', () => {
      expect(AssetSchema).toBeDefined();
      const asset = AssetSchema.parse({
        url: 'https://example.com/model.fbx',
        fileType: 'fbx',
        verification: null,
      });
      expect(asset.fileType).toBe('fbx');
    });

    it('exports Lsp4AttributeSchema', () => {
      expect(Lsp4AttributeSchema).toBeDefined();
      const attr = Lsp4AttributeSchema.parse({ key: 'color', value: 'blue', type: 'string' });
      expect(attr.key).toBe('color');
    });
  });

  describe('profile schemas', () => {
    it('exports ProfileSchema', () => {
      expect(ProfileSchema).toBeDefined();
      const profile = ProfileSchema.parse({
        address: '0x1234',
        name: 'Test',
        description: null,
        tags: null,
        links: null,
        avatar: null,
        profileImage: null,
        backgroundImage: null,
        followerCount: 0,
        followingCount: 0,
      });
      expect(profile.address).toBe('0x1234');
    });

    it('exports ProfileFilterSchema', () => {
      expect(ProfileFilterSchema).toBeDefined();
      expect(ProfileFilterSchema.parse({})).toEqual({});
    });

    it('exports ProfileSortFieldSchema', () => {
      expect(ProfileSortFieldSchema).toBeDefined();
      expect(ProfileSortFieldSchema.parse('name')).toBe('name');
    });

    it('exports ProfileSortSchema', () => {
      expect(ProfileSortSchema).toBeDefined();
    });

    it('exports ProfileIncludeSchema', () => {
      expect(ProfileIncludeSchema).toBeDefined();
      expect(ProfileIncludeSchema.parse({ name: true })).toEqual({ name: true });
    });

    it('exports UseProfileParamsSchema', () => {
      expect(UseProfileParamsSchema).toBeDefined();
    });

    it('exports UseProfilesParamsSchema', () => {
      expect(UseProfilesParamsSchema).toBeDefined();
    });

    it('exports UseInfiniteProfilesParamsSchema', () => {
      expect(UseInfiniteProfilesParamsSchema).toBeDefined();
    });
  });

  describe('digital asset schemas', () => {
    it('exports StandardSchema and TokenTypeSchema', () => {
      expect(StandardSchema).toBeDefined();
      expect(StandardSchema.parse('LSP7')).toBe('LSP7');
      expect(TokenTypeSchema).toBeDefined();
      expect(TokenTypeSchema.parse('TOKEN')).toBe('TOKEN');
    });

    it('exports DigitalAssetOwnerSchema', () => {
      expect(DigitalAssetOwnerSchema).toBeDefined();
    });

    it('exports DigitalAssetSchema', () => {
      expect(DigitalAssetSchema).toBeDefined();
    });

    it('exports digital asset filter, sort, include schemas', () => {
      expect(DigitalAssetFilterSchema).toBeDefined();
      expect(DigitalAssetSortFieldSchema).toBeDefined();
      expect(DigitalAssetSortSchema).toBeDefined();
      expect(DigitalAssetIncludeSchema).toBeDefined();
    });

    it('exports digital asset param schemas', () => {
      expect(UseDigitalAssetParamsSchema).toBeDefined();
      expect(UseDigitalAssetsParamsSchema).toBeDefined();
      expect(UseInfiniteDigitalAssetsParamsSchema).toBeDefined();
    });
  });

  describe('nft schemas', () => {
    it('exports NftSchema and related schemas', () => {
      expect(NftSchema).toBeDefined();
      expect(NftFilterSchema).toBeDefined();
      expect(NftSortFieldSchema).toBeDefined();
      expect(NftSortSchema).toBeDefined();
      expect(NftIncludeSchema).toBeDefined();
    });

    it('exports nft param schemas', () => {
      expect(UseNftParamsSchema).toBeDefined();
      expect(UseNftsParamsSchema).toBeDefined();
      expect(UseInfiniteNftsParamsSchema).toBeDefined();
    });
  });

  describe('owned asset schemas', () => {
    it('exports OwnedAssetSchema and related schemas', () => {
      expect(OwnedAssetSchema).toBeDefined();
      expect(OwnedAssetFilterSchema).toBeDefined();
      expect(OwnedAssetSortFieldSchema).toBeDefined();
      expect(OwnedAssetSortSchema).toBeDefined();
      expect(OwnedAssetIncludeSchema).toBeDefined();
    });

    it('exports owned asset param schemas', () => {
      expect(UseOwnedAssetsParamsSchema).toBeDefined();
      expect(UseInfiniteOwnedAssetsParamsSchema).toBeDefined();
    });
  });

  describe('owned token schemas', () => {
    it('exports OwnedTokenSchema and related schemas', () => {
      expect(OwnedTokenSchema).toBeDefined();
      expect(OwnedTokenFilterSchema).toBeDefined();
      expect(OwnedTokenSortFieldSchema).toBeDefined();
      expect(OwnedTokenSortSchema).toBeDefined();
      expect(OwnedTokenIncludeSchema).toBeDefined();
    });

    it('exports owned token param schemas', () => {
      expect(UseOwnedTokensParamsSchema).toBeDefined();
      expect(UseInfiniteOwnedTokensParamsSchema).toBeDefined();
    });
  });

  describe('follower schemas', () => {
    it('exports FollowerSchema and related schemas', () => {
      expect(FollowerSchema).toBeDefined();
      expect(FollowCountSchema).toBeDefined();
      expect(FollowerFilterSchema).toBeDefined();
      expect(FollowerSortFieldSchema).toBeDefined();
      expect(FollowerSortSchema).toBeDefined();
      expect(FollowerIncludeSchema).toBeDefined();
    });

    it('exports follower param schemas', () => {
      expect(UseFollowsParamsSchema).toBeDefined();
      expect(UseInfiniteFollowsParamsSchema).toBeDefined();
      expect(UseFollowCountParamsSchema).toBeDefined();
      expect(UseIsFollowingParamsSchema).toBeDefined();
    });
  });

  describe('creator schemas', () => {
    it('exports CreatorSchema and related schemas', () => {
      expect(CreatorSchema).toBeDefined();
      expect(CreatorFilterSchema).toBeDefined();
      expect(CreatorSortFieldSchema).toBeDefined();
      expect(CreatorSortSchema).toBeDefined();
      expect(CreatorIncludeSchema).toBeDefined();
    });

    it('exports creator param schemas', () => {
      expect(UseCreatorsParamsSchema).toBeDefined();
      expect(UseInfiniteCreatorsParamsSchema).toBeDefined();
    });
  });

  describe('issued asset schemas', () => {
    it('exports IssuedAssetSchema and related schemas', () => {
      expect(IssuedAssetSchema).toBeDefined();
      expect(IssuedAssetFilterSchema).toBeDefined();
      expect(IssuedAssetSortFieldSchema).toBeDefined();
      expect(IssuedAssetSortSchema).toBeDefined();
      expect(IssuedAssetIncludeSchema).toBeDefined();
    });

    it('exports issued asset param schemas', () => {
      expect(UseIssuedAssetsParamsSchema).toBeDefined();
      expect(UseInfiniteIssuedAssetsParamsSchema).toBeDefined();
    });
  });

  describe('encrypted asset schemas', () => {
    it('exports EncryptedAssetSchema and related schemas', () => {
      expect(EncryptedAssetSchema).toBeDefined();
      expect(EncryptedAssetFilterSchema).toBeDefined();
      expect(EncryptedAssetSortFieldSchema).toBeDefined();
      expect(EncryptedAssetSortSchema).toBeDefined();
      expect(EncryptedAssetIncludeSchema).toBeDefined();
    });

    it('exports encrypted asset param schemas', () => {
      expect(UseEncryptedAssetsParamsSchema).toBeDefined();
      expect(UseInfiniteEncryptedAssetsParamsSchema).toBeDefined();
    });
  });

  describe('data changed event schemas', () => {
    it('exports DataChangedEventSchema and related schemas', () => {
      expect(DataChangedEventSchema).toBeDefined();
      expect(DataChangedEventFilterSchema).toBeDefined();
      expect(DataChangedEventSortFieldSchema).toBeDefined();
      expect(DataChangedEventSortSchema).toBeDefined();
      expect(DataChangedEventIncludeSchema).toBeDefined();
    });

    it('exports data changed event param schemas', () => {
      expect(UseDataChangedEventsParamsSchema).toBeDefined();
      expect(UseInfiniteDataChangedEventsParamsSchema).toBeDefined();
    });
  });

  describe('token ID data changed event schemas', () => {
    it('exports TokenIdDataChangedEventSchema and related schemas', () => {
      expect(TokenIdDataChangedEventSchema).toBeDefined();
      expect(TokenIdDataChangedEventFilterSchema).toBeDefined();
      expect(TokenIdDataChangedEventSortFieldSchema).toBeDefined();
      expect(TokenIdDataChangedEventSortSchema).toBeDefined();
      expect(TokenIdDataChangedEventIncludeSchema).toBeDefined();
    });

    it('exports token ID data changed event param schemas', () => {
      expect(UseTokenIdDataChangedEventsParamsSchema).toBeDefined();
      expect(UseInfiniteTokenIdDataChangedEventsParamsSchema).toBeDefined();
    });
  });

  describe('universal receiver event schemas', () => {
    it('exports UniversalReceiverEventSchema and related schemas', () => {
      expect(UniversalReceiverEventSchema).toBeDefined();
      expect(UniversalReceiverEventFilterSchema).toBeDefined();
      expect(UniversalReceiverEventSortFieldSchema).toBeDefined();
      expect(UniversalReceiverEventSortSchema).toBeDefined();
      expect(UniversalReceiverEventIncludeSchema).toBeDefined();
    });

    it('exports universal receiver event param schemas', () => {
      expect(UseUniversalReceiverEventsParamsSchema).toBeDefined();
      expect(UseInfiniteUniversalReceiverEventsParamsSchema).toBeDefined();
    });
  });

  describe('type exports', () => {
    it('exports error type aliases', () => {
      const _category: IndexerErrorCategory = 'NETWORK';
      const _code: IndexerErrorCode = 'NETWORK_TIMEOUT';
      expect(_category).toBe('NETWORK');
      expect(_code).toBe('NETWORK_TIMEOUT');
    });

    it('exports subscription type aliases', () => {
      const _hookOpts: SubscriptionHookOptions<unknown> = { enabled: true };
      expect(_hookOpts.enabled).toBe(true);

      const _subReturn: UseSubscriptionReturn<string> = {
        data: null,
        isConnected: false,
        isSubscribed: false,
        error: null,
      };
      expect(_subReturn.data).toBeNull();
    });
  });
});
