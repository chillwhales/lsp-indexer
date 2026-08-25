import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as actions from '../actions';

import {
  getBlocks,
  getChillwhalesNfts,
  getControllers,
  getCreators,
  getDataChangedEvents,
  getDataValues,
  getDigitalAsset,
  getDigitalAssets,
  getEncryptedAssets,
  getFollowCount,
  getFollows,
  getIsFollowing,
  getIssuedAssets,
  getLatestDataChangedEvent,
  getLatestTokenIdDataChangedEvent,
  getMetadataRevisions,
  getNft,
  getNfts,
  getOwnedAsset,
  getOwnedAssets,
  getOwnedToken,
  getOwnedTokens,
  getProfile,
  getProfiles,
  getTokenIdDataChangedEvents,
  getUniversalReceiverEvents,
  getV3Domain,
} from '../actions';

import {
  useBlocks,
  useChillwhalesNfts,
  useControllers,
  useCreators,
  useDataChangedEvents,
  useDataValues,
  useDigitalAsset,
  useDigitalAssets,
  useEncryptedAssets,
  useEvents,
  useFollowCount,
  useFollows,
  useIndexedHead,
  useIndexedHeads,
  useInfiniteBlocks,
  useInfiniteCreators,
  useInfiniteDataChangedEvents,
  useInfiniteDataValues,
  useInfiniteDigitalAssets,
  useInfiniteEncryptedAssets,
  useInfiniteEvents,
  useInfiniteFollows,
  useInfiniteIssuedAssets,
  useInfiniteMetadataRevisions,
  useInfiniteNfts,
  useInfiniteOwnedAssets,
  useInfiniteOwnedTokens,
  useInfiniteProfiles,
  useInfiniteTokenIdDataChangedEvents,
  useInfiniteUniversalReceiverEvents,
  useIsFollowing,
  useIssuedAssets,
  useLatestDataChangedEvent,
  useLatestTokenIdDataChangedEvent,
  useMetadataRevisions,
  useNft,
  useNfts,
  useOwnedAsset,
  useOwnedAssets,
  useOwnedToken,
  useOwnedTokens,
  useProfile,
  useProfiles,
  useTokenIdDataChangedEvents,
  useUniversalReceiverEvents,
  useV3Infinite,
  useV3List,
} from '../index';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const distDir = resolve(__dirname, '../../dist');

function readDistFile(name: string): string {
  return readFileSync(resolve(distDir, name), 'utf-8');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('@lsp-indexer/next', () => {
  // -------------------------------------------------------------------------
  // Bundle boundary tests — ensure server env vars never leak to client
  // -------------------------------------------------------------------------

  describe('bundle boundaries', () => {
    it('dist/actions.js starts with "use server" directive', () => {
      const content = readDistFile('actions.js');
      expect(content.startsWith('"use server"')).toBe(true);
    });

    it('dist/index.js starts with "use client" directive', () => {
      const content = readDistFile('index.js');
      expect(content.startsWith('"use client"')).toBe(true);
    });

    it('dist/index.js does NOT contain "use server" directive', () => {
      const content = readDistFile('index.js');
      expect(content).not.toContain('"use server"');
    });

    it('dist/index.js does NOT contain server env var references', () => {
      const content = readDistFile('index.js');
      expect(content).not.toContain('INDEXER_URL');
      expect(content).not.toContain('INDEXER_WS_URL');
      expect(content).not.toContain('INDEXER_ALLOWED_ORIGINS');
      expect(content).not.toContain('getServerUrl');
      expect(content).not.toContain('getServerWsUrl');
    });

    it('dist/index.js does NOT contain fetch functions', () => {
      const content = readDistFile('index.js');
      expect(content).not.toContain('fetchProfile');
      expect(content).not.toContain('fetchProfiles');
      expect(content).not.toContain('fetchDigitalAsset');
    });

    it('dist/actions.js does NOT contain "use client" directive', () => {
      const content = readDistFile('actions.js');
      expect(content).not.toContain('"use client"');
    });

    it('actions are imported from @lsp-indexer/next/actions, not inlined', () => {
      const content = readDistFile('index.js');
      // Actions should be imported as external, not bundled inline
      expect(content).toContain('@lsp-indexer/next/actions');
      // The action implementations (getServerUrl, fetchProfile) should NOT be inlined
      expect(content).not.toContain('getServerUrl');
      expect(content).not.toContain('fetchProfile(');
      expect(content).not.toContain('fetchProfiles(');
    });
  });

  // -------------------------------------------------------------------------
  // Server action exports
  // -------------------------------------------------------------------------

  describe('server actions', () => {
    it('exports all profile server actions', () => {
      expect(typeof getProfile).toBe('function');
      expect(typeof getProfiles).toBe('function');
    });

    it('exports all digital asset server actions', () => {
      expect(typeof getDigitalAsset).toBe('function');
      expect(typeof getDigitalAssets).toBe('function');
    });

    it('exports all nft server actions', () => {
      expect(typeof getNft).toBe('function');
      expect(typeof getNfts).toBe('function');
    });

    it('exports all owned asset/token server actions', () => {
      expect(typeof getOwnedAsset).toBe('function');
      expect(typeof getOwnedAssets).toBe('function');
      expect(typeof getOwnedToken).toBe('function');
      expect(typeof getOwnedTokens).toBe('function');
    });

    it('exports all follower server actions', () => {
      expect(typeof getFollows).toBe('function');
      expect(typeof getFollowCount).toBe('function');
      expect(typeof getIsFollowing).toBe('function');
    });

    it('exports all creator and issued asset server actions', () => {
      expect(typeof getCreators).toBe('function');
      expect(typeof getIssuedAssets).toBe('function');
    });

    it('exports all encrypted asset server actions', () => {
      expect(typeof getEncryptedAssets).toBe('function');
    });

    it('exports all event server actions', () => {
      expect(typeof getLatestDataChangedEvent).toBe('function');
      expect(typeof getDataChangedEvents).toBe('function');
      expect(typeof getLatestTokenIdDataChangedEvent).toBe('function');
      expect(typeof getTokenIdDataChangedEvents).toBe('function');
      expect(typeof getUniversalReceiverEvents).toBe('function');
    });

    it('exports the uniform v3 action and new domain conveniences', () => {
      expect(typeof getV3Domain).toBe('function');
      expect(typeof getBlocks).toBe('function');
      expect(typeof getControllers).toBe('function');
      expect(typeof getChillwhalesNfts).toBe('function');
      expect(typeof getDataValues).toBe('function');
      expect(typeof getMetadataRevisions).toBe('function');
      expect(
        [
          'getV3Blocks',
          'getV3Events',
          'getV3UniversalProfiles',
          'getV3DigitalAssets',
          'getV3Nfts',
          'getV3OwnedAssets',
          'getV3OwnedTokens',
          'getV3Followers',
          'getV3Creators',
          'getV3IssuedAssets',
          'getV3Controllers',
          'getV3ChillwhalesNfts',
          'getV3DataValues',
          'getV3MetadataRevisions',
          'getV3IndexedHeads',
        ].every((name) => typeof Reflect.get(actions, name) === 'function'),
      ).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Hook exports
  // -------------------------------------------------------------------------

  describe('hooks', () => {
    it('exports all query hooks', () => {
      expect(typeof useProfile).toBe('function');
      expect(typeof useProfiles).toBe('function');
      expect(typeof useInfiniteProfiles).toBe('function');
      expect(typeof useDigitalAsset).toBe('function');
      expect(typeof useDigitalAssets).toBe('function');
      expect(typeof useInfiniteDigitalAssets).toBe('function');
      expect(typeof useNft).toBe('function');
      expect(typeof useNfts).toBe('function');
      expect(typeof useInfiniteNfts).toBe('function');
      expect(typeof useOwnedAsset).toBe('function');
      expect(typeof useOwnedAssets).toBe('function');
      expect(typeof useInfiniteOwnedAssets).toBe('function');
      expect(typeof useOwnedToken).toBe('function');
      expect(typeof useOwnedTokens).toBe('function');
      expect(typeof useInfiniteOwnedTokens).toBe('function');
      expect(typeof useFollows).toBe('function');
      expect(typeof useInfiniteFollows).toBe('function');
      expect(typeof useFollowCount).toBe('function');
      expect(typeof useIsFollowing).toBe('function');
      expect(typeof useCreators).toBe('function');
      expect(typeof useInfiniteCreators).toBe('function');
      expect(typeof useIssuedAssets).toBe('function');
      expect(typeof useInfiniteIssuedAssets).toBe('function');
      expect(typeof useEncryptedAssets).toBe('function');
      expect(typeof useInfiniteEncryptedAssets).toBe('function');
      expect(typeof useDataChangedEvents).toBe('function');
      expect(typeof useInfiniteDataChangedEvents).toBe('function');
      expect(typeof useLatestDataChangedEvent).toBe('function');
      expect(typeof useTokenIdDataChangedEvents).toBe('function');
      expect(typeof useInfiniteTokenIdDataChangedEvents).toBe('function');
      expect(typeof useLatestTokenIdDataChangedEvent).toBe('function');
      expect(typeof useUniversalReceiverEvents).toBe('function');
      expect(typeof useInfiniteUniversalReceiverEvents).toBe('function');
      expect(typeof useV3List).toBe('function');
      expect(typeof useV3Infinite).toBe('function');
      expect(typeof useBlocks).toBe('function');
      expect(typeof useInfiniteBlocks).toBe('function');
      expect(typeof useEvents).toBe('function');
      expect(typeof useInfiniteEvents).toBe('function');
      expect(typeof useControllers).toBe('function');
      expect(typeof useChillwhalesNfts).toBe('function');
      expect(typeof useDataValues).toBe('function');
      expect(typeof useInfiniteDataValues).toBe('function');
      expect(typeof useMetadataRevisions).toBe('function');
      expect(typeof useInfiniteMetadataRevisions).toBe('function');
      expect(typeof useIndexedHead).toBe('function');
      expect(typeof useIndexedHeads).toBe('function');
    });
  });
});
