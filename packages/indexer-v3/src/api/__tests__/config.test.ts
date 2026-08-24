import { describe, expect, it } from 'vitest';
import { loadHasuraApiConfig } from '../config.js';

describe('Hasura API configuration', () => {
  it('normalizes either the origin or GraphQL endpoint', () => {
    expect(
      loadHasuraApiConfig({
        HASURA_GRAPHQL_ENDPOINT: 'https://indexer.example.test/v1/graphql',
        HASURA_GRAPHQL_ADMIN_SECRET: 'test-secret',
      }),
    ).toEqual({
      metadataEndpoint: 'https://indexer.example.test/v1/metadata',
      graphqlEndpoint: 'https://indexer.example.test/v1/graphql',
      adminSecret: 'test-secret',
      timeoutMs: 30_000,
    });
    expect(
      loadHasuraApiConfig({
        HASURA_GRAPHQL_ENDPOINT: 'https://indexer.example.test/v1/metadata/',
        HASURA_GRAPHQL_ADMIN_SECRET: 'test-secret',
      }),
    ).toMatchObject({
      metadataEndpoint: 'https://indexer.example.test/v1/metadata',
      graphqlEndpoint: 'https://indexer.example.test/v1/graphql',
    });
  });

  it.each([
    {},
    { HASURA_GRAPHQL_ENDPOINT: 'ftp://indexer.example.test' },
    { HASURA_GRAPHQL_ENDPOINT: 'https://user@indexer.example.test' },
    { HASURA_GRAPHQL_ENDPOINT: 'https://indexer.example.test/custom' },
    { HASURA_GRAPHQL_ENDPOINT: 'https://indexer.example.test?debug=true' },
    {
      HASURA_GRAPHQL_ENDPOINT: 'https://indexer.example.test',
      HASURA_GRAPHQL_ADMIN_SECRET: ' ',
    },
  ])('rejects incomplete or unsafe endpoint configuration', (env) => {
    expect(() => loadHasuraApiConfig(env)).toThrow();
  });
});
