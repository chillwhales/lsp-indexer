import { describe, expect, it } from 'vitest';

import {
  // Hook factories
  createUseDetail,
  createUseInfinite,
  createUseList,
  createUseSubscription,
  IndexerSubscriptionProvider,
  // Subscription infrastructure
  SubscriptionClientContext,
  // Creator hooks
  useCreators,
  useCreatorSubscription,
  // Data changed event hooks
  useDataChangedEvents,
  useDataChangedEventSubscription,
  // Digital asset hooks
  useDigitalAsset,
  useDigitalAssets,
  useDigitalAssetSubscription,
  // Encrypted asset hooks
  useEncryptedAssets,
  useEncryptedAssetSubscription,
  useFollowCount,
  useFollowerSubscription,
  // Follower hooks
  useFollows,
  useInfiniteCreators,
  useInfiniteDataChangedEvents,
  useInfiniteDigitalAssets,
  useInfiniteEncryptedAssets,
  useInfiniteFollows,
  useInfiniteIssuedAssets,
  useInfiniteNfts,
  useInfiniteOwnedAssets,
  useInfiniteOwnedTokens,
  useInfiniteProfiles,
  useInfiniteTokenIdDataChangedEvents,
  useInfiniteUniversalReceiverEvents,
  useIsFollowing,
  // Issued asset hooks
  useIssuedAssets,
  useIssuedAssetSubscription,
  useLatestDataChangedEvent,
  useLatestTokenIdDataChangedEvent,
  // NFT hooks
  useNft,
  useNfts,
  useNftSubscription,
  // Owned asset hooks
  useOwnedAsset,
  useOwnedAssets,
  useOwnedAssetSubscription,
  // Owned token hooks
  useOwnedToken,
  useOwnedTokens,
  useOwnedTokenSubscription,
  // Profile hooks
  useProfile,
  useProfiles,
  useProfileSubscription,
  // Subscription
  useSubscription,
  // Token ID data changed event hooks
  useTokenIdDataChangedEvents,
  useTokenIdDataChangedEventSubscription,
  // Universal receiver event hooks
  useUniversalReceiverEvents,
  useUniversalReceiverEventSubscription,
} from '../index';

describe('@lsp-indexer/react', () => {
  describe('hook factories', () => {
    it('exports createUseDetail', () => {
      expect(createUseDetail).toBeDefined();
      expect(typeof createUseDetail).toBe('function');
    });

    it('exports createUseList', () => {
      expect(createUseList).toBeDefined();
      expect(typeof createUseList).toBe('function');
    });

    it('exports createUseInfinite', () => {
      expect(createUseInfinite).toBeDefined();
      expect(typeof createUseInfinite).toBe('function');
    });

    it('exports createUseSubscription', () => {
      expect(createUseSubscription).toBeDefined();
      expect(typeof createUseSubscription).toBe('function');
    });
  });

  describe('profile hooks', () => {
    it('exports all profile hooks', () => {
      expect(typeof useProfile).toBe('function');
      expect(typeof useProfiles).toBe('function');
      expect(typeof useInfiniteProfiles).toBe('function');
      expect(typeof useProfileSubscription).toBe('function');
    });
  });

  describe('digital asset hooks', () => {
    it('exports all digital asset hooks', () => {
      expect(typeof useDigitalAsset).toBe('function');
      expect(typeof useDigitalAssets).toBe('function');
      expect(typeof useInfiniteDigitalAssets).toBe('function');
      expect(typeof useDigitalAssetSubscription).toBe('function');
    });
  });

  describe('nft hooks', () => {
    it('exports all nft hooks', () => {
      expect(typeof useNft).toBe('function');
      expect(typeof useNfts).toBe('function');
      expect(typeof useInfiniteNfts).toBe('function');
      expect(typeof useNftSubscription).toBe('function');
    });
  });

  describe('owned asset hooks', () => {
    it('exports all owned asset hooks', () => {
      expect(typeof useOwnedAsset).toBe('function');
      expect(typeof useOwnedAssets).toBe('function');
      expect(typeof useInfiniteOwnedAssets).toBe('function');
      expect(typeof useOwnedAssetSubscription).toBe('function');
    });
  });

  describe('owned token hooks', () => {
    it('exports all owned token hooks', () => {
      expect(typeof useOwnedToken).toBe('function');
      expect(typeof useOwnedTokens).toBe('function');
      expect(typeof useInfiniteOwnedTokens).toBe('function');
      expect(typeof useOwnedTokenSubscription).toBe('function');
    });
  });

  describe('follower hooks', () => {
    it('exports all follower hooks', () => {
      expect(typeof useFollows).toBe('function');
      expect(typeof useInfiniteFollows).toBe('function');
      expect(typeof useFollowCount).toBe('function');
      expect(typeof useIsFollowing).toBe('function');
      expect(typeof useFollowerSubscription).toBe('function');
    });
  });

  describe('creator hooks', () => {
    it('exports all creator hooks', () => {
      expect(typeof useCreators).toBe('function');
      expect(typeof useInfiniteCreators).toBe('function');
      expect(typeof useCreatorSubscription).toBe('function');
    });
  });

  describe('issued asset hooks', () => {
    it('exports all issued asset hooks', () => {
      expect(typeof useIssuedAssets).toBe('function');
      expect(typeof useInfiniteIssuedAssets).toBe('function');
      expect(typeof useIssuedAssetSubscription).toBe('function');
    });
  });

  describe('encrypted asset hooks', () => {
    it('exports all encrypted asset hooks', () => {
      expect(typeof useEncryptedAssets).toBe('function');
      expect(typeof useInfiniteEncryptedAssets).toBe('function');
      expect(typeof useEncryptedAssetSubscription).toBe('function');
    });
  });

  describe('data changed event hooks', () => {
    it('exports all data changed event hooks', () => {
      expect(typeof useDataChangedEvents).toBe('function');
      expect(typeof useInfiniteDataChangedEvents).toBe('function');
      expect(typeof useLatestDataChangedEvent).toBe('function');
      expect(typeof useDataChangedEventSubscription).toBe('function');
    });
  });

  describe('token ID data changed event hooks', () => {
    it('exports all token ID data changed event hooks', () => {
      expect(typeof useTokenIdDataChangedEvents).toBe('function');
      expect(typeof useInfiniteTokenIdDataChangedEvents).toBe('function');
      expect(typeof useLatestTokenIdDataChangedEvent).toBe('function');
      expect(typeof useTokenIdDataChangedEventSubscription).toBe('function');
    });
  });

  describe('universal receiver event hooks', () => {
    it('exports all universal receiver event hooks', () => {
      expect(typeof useUniversalReceiverEvents).toBe('function');
      expect(typeof useInfiniteUniversalReceiverEvents).toBe('function');
      expect(typeof useUniversalReceiverEventSubscription).toBe('function');
    });
  });

  describe('subscription infrastructure', () => {
    it('exports useSubscription hook', () => {
      expect(typeof useSubscription).toBe('function');
    });

    it('exports SubscriptionClientContext', () => {
      expect(SubscriptionClientContext).toBeDefined();
    });

    it('exports IndexerSubscriptionProvider', () => {
      expect(IndexerSubscriptionProvider).toBeDefined();
    });
  });
});
