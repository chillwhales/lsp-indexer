import { describe, expect, it } from 'vitest';
import { IndexerError, narrowSubscriptionError } from '..';

describe('IndexerError', () => {
  it('maps status codes and serializes stable public fields', () => {
    expect(IndexerError.fromStatusCode(401).code).toBe('HTTP_UNAUTHORIZED');
    expect(IndexerError.fromStatusCode(403).code).toBe('HTTP_FORBIDDEN');
    expect(IndexerError.fromStatusCode(404).code).toBe('HTTP_NOT_FOUND');
    expect(IndexerError.fromStatusCode(429).code).toBe('HTTP_TOO_MANY_REQUESTS');
    expect(IndexerError.fromStatusCode(500).code).toBe('HTTP_SERVER_ERROR');
    expect(IndexerError.fromStatusCode(418).code).toBe('HTTP_UNKNOWN');
    expect(IndexerError.fromStatusCode(404, 'query Test').toJSON()).toMatchObject({
      name: 'IndexerError',
      category: 'HTTP',
      code: 'HTTP_NOT_FOUND',
      query: 'query Test',
    });
  });

  it('classifies GraphQL and validation errors with normalized details', () => {
    expect(IndexerError.fromGraphQLErrors([{ message: 'permission denied' }])).toMatchObject({
      code: 'PERMISSION_DENIED',
    });
    expect(IndexerError.fromGraphQLErrors([{ message: 'field missing not found' }])).toMatchObject({
      code: 'GRAPHQL_VALIDATION',
    });
    expect(IndexerError.fromGraphQLErrors([{ message: 'resolver failed' }])).toMatchObject({
      code: 'GRAPHQL_UNKNOWN',
    });
    expect(
      IndexerError.fromValidationError(
        [
          { path: ['filter', 'limit'], message: 'too large' },
          { path: [], message: 'invalid root' },
        ],
        'fetchProfiles',
      ),
    ).toMatchObject({
      validationErrors: [
        { path: 'filter.limit', message: 'too large' },
        { path: '(root)', message: 'invalid root' },
      ],
    });
  });

  it('narrows arbitrary GraphQL and subscription payloads without unsafe assumptions', () => {
    expect(IndexerError.narrowGraphQLError('bad')).toEqual({
      message: 'bad',
      extensions: undefined,
    });
    expect(IndexerError.narrowGraphQLError(null)).toEqual({
      message: 'Unknown error',
      extensions: undefined,
    });
    expect(
      IndexerError.narrowGraphQLError({ message: 'bad', extensions: ['not', 'an', 'object'] }),
    ).toEqual({ message: 'bad', extensions: undefined });
    expect(IndexerError.narrowGraphQLError({ extensions: { code: 'x' } })).toEqual({
      message: 'Unknown error',
      extensions: { code: 'x' },
    });

    const indexed = IndexerError.fromStatusCode(404);
    expect(narrowSubscriptionError(indexed)).toBe(indexed.message);
    expect(narrowSubscriptionError(new Error('broken'))).toBe('broken');
    expect(narrowSubscriptionError('offline')).toBe('offline');
    expect(narrowSubscriptionError({})).toBe('Unknown error');
    expect(narrowSubscriptionError(null)).toBe('');
  });

  it('distinguishes timeout-like network errors', () => {
    const aborted = new Error('aborted');
    aborted.name = 'AbortError';
    expect(IndexerError.fromNetworkError(aborted).code).toBe('NETWORK_TIMEOUT');
    expect(IndexerError.fromNetworkError(new Error('connection reset')).code).toBe(
      'NETWORK_UNKNOWN',
    );
  });
});
