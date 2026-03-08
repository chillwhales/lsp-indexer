import { describe, expect, it } from 'vitest';

import {
  creatorKeys,
  dataChangedEventKeys,
  digitalAssetKeys,
  encryptedAssetKeys,
  // Client utilities
  execute,
  fetchCreators,
  fetchDataChangedEvents,
  fetchDigitalAsset,
  fetchDigitalAssets,
  fetchEncryptedAssets,
  fetchFollowCount,
  fetchFollows,
  fetchIsFollowing,
  fetchIssuedAssets,
  fetchLatestDataChangedEvent,
  fetchLatestTokenIdDataChangedEvent,
  fetchNft,
  fetchNfts,
  fetchOwnedAsset,
  fetchOwnedAssets,
  fetchOwnedToken,
  fetchOwnedTokens,
  // Service functions
  fetchProfile,
  fetchProfiles,
  fetchTokenIdDataChangedEvents,
  fetchUniversalReceiverEvents,
  followerKeys,
  getClientUrl,
  getClientWsUrl,
  getServerUrl,
  getServerWsUrl,
  // Error handling
  IndexerError,
  issuedAssetKeys,
  narrowSubscriptionError,
  nftKeys,
  ownedAssetKeys,
  ownedTokenKeys,
  parseCreator,
  parseDataChangedEvent,
  parseDigitalAsset,
  parseEncryptedAsset,
  parseFollower,
  parseIssuedAsset,
  parseNft,
  parseOwnedAsset,
  parseOwnedToken,
  // Parsers
  parseProfile,
  parseTokenIdDataChangedEvent,
  parseUniversalReceiverEvent,
  // Query key factories
  profileKeys,
  stripExcluded,
  // Subscription infrastructure
  SubscriptionClient,
  tokenIdDataChangedEventKeys,
  universalReceiverEventKeys,
} from '../index';

describe('@lsp-indexer/node', () => {
  describe('error handling', () => {
    it('exports IndexerError class', () => {
      expect(IndexerError).toBeDefined();
      const err = new IndexerError({
        category: 'NETWORK',
        code: 'NETWORK_TIMEOUT',
        message: 'test timeout',
      });
      expect(err).toBeInstanceOf(Error);
      expect(err.category).toBe('NETWORK');
      expect(err.code).toBe('NETWORK_TIMEOUT');
    });

    it('IndexerError.toJSON serializes correctly', () => {
      const err = new IndexerError({
        category: 'HTTP',
        code: 'HTTP_NOT_FOUND',
        message: 'not found',
        statusCode: 404,
      });
      const json = err.toJSON();
      expect(json.category).toBe('HTTP');
      expect(json.code).toBe('HTTP_NOT_FOUND');
      expect(json.statusCode).toBe(404);
    });

    it('IndexerError.fromNetworkError creates from Error', () => {
      const err = IndexerError.fromNetworkError(new Error('connection refused'));
      expect(err.category).toBe('NETWORK');
      expect(err.code).toBe('NETWORK_UNKNOWN');
    });

    it('IndexerError.fromNetworkError detects timeout', () => {
      const abortErr = new Error('timeout');
      abortErr.name = 'AbortError';
      const err = IndexerError.fromNetworkError(abortErr);
      expect(err.code).toBe('NETWORK_TIMEOUT');
    });

    it('IndexerError.fromGraphQLErrors creates from errors array', () => {
      const err = IndexerError.fromGraphQLErrors([{ message: 'field not found in table' }]);
      expect(err.category).toBe('GRAPHQL');
    });

    it('IndexerError.fromGraphQLErrors detects permission errors', () => {
      const err = IndexerError.fromGraphQLErrors([
        { message: 'not allowed', extensions: { code: 'access-denied' } },
      ]);
      expect(err.code).toBe('PERMISSION_DENIED');
    });

    it('IndexerError.fromGraphQLErrors detects validation errors', () => {
      const err = IndexerError.fromGraphQLErrors([
        { message: 'field "xyz" not found in type', extensions: { code: 'validation-failed' } },
      ]);
      expect(err.code).toBe('GRAPHQL_VALIDATION');
    });

    it('IndexerError.narrowGraphQLError handles various inputs', () => {
      expect(IndexerError.narrowGraphQLError(null)).toEqual({
        message: 'Unknown error',
        extensions: undefined,
      });
      expect(IndexerError.narrowGraphQLError('string error')).toEqual({
        message: 'string error',
        extensions: undefined,
      });
      expect(IndexerError.narrowGraphQLError({ message: 'test' })).toEqual({
        message: 'test',
        extensions: undefined,
      });
      expect(
        IndexerError.narrowGraphQLError({
          message: 'test',
          extensions: { code: 'access-denied' },
        }),
      ).toEqual({
        message: 'test',
        extensions: { code: 'access-denied' },
      });
      expect(IndexerError.narrowGraphQLError({ message: 'test', extensions: [1, 2] })).toEqual({
        message: 'test',
        extensions: undefined,
      });
    });

    it('IndexerError.fromValidationError creates from Zod issues', () => {
      const err = IndexerError.fromValidationError(
        [{ path: ['address'], message: 'Required' }],
        'getProfile',
      );
      expect(err.category).toBe('VALIDATION');
      expect(err.code).toBe('VALIDATION_FAILED');
      expect(err.validationErrors).toHaveLength(1);
    });

    it('exports narrowSubscriptionError', () => {
      expect(narrowSubscriptionError).toBeDefined();
      expect(typeof narrowSubscriptionError).toBe('function');
    });
  });

  describe('client utilities', () => {
    it('exports execute function', () => {
      expect(execute).toBeDefined();
      expect(typeof execute).toBe('function');
    });

    it('exports env helper functions', () => {
      expect(getClientUrl).toBeDefined();
      expect(getClientWsUrl).toBeDefined();
      expect(getServerUrl).toBeDefined();
      expect(getServerWsUrl).toBeDefined();
    });
  });

  describe('query key factories', () => {
    it('exports all key factories', () => {
      expect(profileKeys).toBeDefined();
      expect(digitalAssetKeys).toBeDefined();
      expect(nftKeys).toBeDefined();
      expect(ownedAssetKeys).toBeDefined();
      expect(ownedTokenKeys).toBeDefined();
      expect(followerKeys).toBeDefined();
      expect(creatorKeys).toBeDefined();
      expect(issuedAssetKeys).toBeDefined();
      expect(encryptedAssetKeys).toBeDefined();
      expect(dataChangedEventKeys).toBeDefined();
      expect(tokenIdDataChangedEventKeys).toBeDefined();
      expect(universalReceiverEventKeys).toBeDefined();
    });
  });

  describe('service functions', () => {
    it('exports all fetch functions', () => {
      expect(typeof fetchProfile).toBe('function');
      expect(typeof fetchProfiles).toBe('function');
      expect(typeof fetchDigitalAsset).toBe('function');
      expect(typeof fetchDigitalAssets).toBe('function');
      expect(typeof fetchNft).toBe('function');
      expect(typeof fetchNfts).toBe('function');
      expect(typeof fetchOwnedAsset).toBe('function');
      expect(typeof fetchOwnedAssets).toBe('function');
      expect(typeof fetchOwnedToken).toBe('function');
      expect(typeof fetchOwnedTokens).toBe('function');
      expect(typeof fetchFollows).toBe('function');
      expect(typeof fetchFollowCount).toBe('function');
      expect(typeof fetchIsFollowing).toBe('function');
      expect(typeof fetchCreators).toBe('function');
      expect(typeof fetchIssuedAssets).toBe('function');
      expect(typeof fetchEncryptedAssets).toBe('function');
      expect(typeof fetchDataChangedEvents).toBe('function');
      expect(typeof fetchLatestDataChangedEvent).toBe('function');
      expect(typeof fetchTokenIdDataChangedEvents).toBe('function');
      expect(typeof fetchLatestTokenIdDataChangedEvent).toBe('function');
      expect(typeof fetchUniversalReceiverEvents).toBe('function');
    });
  });

  describe('parsers', () => {
    it('exports all parser functions', () => {
      expect(typeof parseProfile).toBe('function');
      expect(typeof parseDigitalAsset).toBe('function');
      expect(typeof parseNft).toBe('function');
      expect(typeof parseOwnedAsset).toBe('function');
      expect(typeof parseOwnedToken).toBe('function');
      expect(typeof parseFollower).toBe('function');
      expect(typeof parseCreator).toBe('function');
      expect(typeof parseIssuedAsset).toBe('function');
      expect(typeof parseEncryptedAsset).toBe('function');
      expect(typeof parseDataChangedEvent).toBe('function');
      expect(typeof parseTokenIdDataChangedEvent).toBe('function');
      expect(typeof parseUniversalReceiverEvent).toBe('function');
      expect(typeof stripExcluded).toBe('function');
    });
  });

  describe('subscription infrastructure', () => {
    it('exports SubscriptionClient class', () => {
      expect(SubscriptionClient).toBeDefined();
    });
  });
});
