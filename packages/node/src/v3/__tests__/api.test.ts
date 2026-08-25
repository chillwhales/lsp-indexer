import type { V3Domain } from '@lsp-indexer/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { executeMock } = vi.hoisted(() => ({ executeMock: vi.fn() }));

vi.mock('../../client/execute', () => ({ execute: executeMock }));

import { IndexerError } from '../../errors';
import {
  buildV3DomainVariables,
  fetchIndexedHead,
  fetchV3Blocks,
  fetchV3ChillwhalesNfts,
  fetchV3Controllers,
  fetchV3Creators,
  fetchV3DataValues,
  fetchV3DigitalAssets,
  fetchV3Domain,
  fetchV3Events,
  fetchV3Followers,
  fetchV3IndexedHeads,
  fetchV3IssuedAssets,
  fetchV3MetadataRevisions,
  fetchV3Nfts,
  fetchV3OwnedAssets,
  fetchV3OwnedTokens,
  fetchV3UniversalProfiles,
  v3Api,
  type V3DomainListParams,
} from '../api-service';
import * as domainKeyFactories from '../domain-keys';
import { collectionAttributeKeys, profileKeys } from '../domain-keys';
import { createIndexerClient } from '../indexer-client';
import { v3Keys } from '../keys';
import { buildV3SubscriptionConfig } from '../subscriptions';
import { ADDRESS, directRows } from './fixtures';

const URL = 'https://indexer.example/v1/graphql';
const NETWORK = 'lukso-mainnet';
const domains = Object.keys(directRows) as V3Domain[];

type Fetcher = (
  url: string,
  params: { network: string },
) => Promise<{ items: unknown[]; totalCount: number }>;

const fetchCases: Array<[V3Domain, Fetcher, unknown]> = [
  ['blocks', fetchV3Blocks, directRows.blocks],
  ['events', fetchV3Events, directRows.events],
  ['profiles', fetchV3UniversalProfiles, directRows.profiles],
  ['digitalAssets', fetchV3DigitalAssets, directRows.digitalAssets],
  ['nfts', fetchV3Nfts, directRows.nfts],
  ['ownedAssets', fetchV3OwnedAssets, directRows.ownedAssets],
  ['ownedTokens', fetchV3OwnedTokens, directRows.ownedTokens],
  ['followers', fetchV3Followers, directRows.followers],
  ['creators', fetchV3Creators, directRows.creators],
  ['issuedAssets', fetchV3IssuedAssets, directRows.issuedAssets],
  ['controllers', fetchV3Controllers, directRows.controllers],
  ['chillwhalesNfts', fetchV3ChillwhalesNfts, directRows.chillwhalesNfts],
  ['dataValues', fetchV3DataValues, directRows.dataValues],
  ['metadataRevisions', fetchV3MetadataRevisions, directRows.metadataRevisions],
  ['indexedHeads', fetchV3IndexedHeads, directRows.indexedHeads],
];

const invalidVariableCases: Array<[V3DomainListParams<'blocks'>, string]> = [
  [{ network: 'Invalid Network' }, 'network'],
  [{ network: NETWORK, limit: 0 }, 'limit'],
  [{ network: NETWORK, offset: -1 }, 'offset'],
  [{ network: NETWORK, offset: Number.MAX_SAFE_INTEGER + 1 }, 'offset'],
];

function buildVariablesFromJavascript(domain: V3Domain, params: Record<string, unknown>): unknown {
  const result: unknown = Reflect.apply(buildV3DomainVariables, undefined, [domain, params]);
  return result;
}

beforeEach(() => {
  executeMock.mockReset();
});

describe('v3 API variables', () => {
  it.each(domains)('always scopes %s to one exact network with stable ordering', (domain) => {
    const variables = buildV3DomainVariables(domain, { network: NETWORK });
    expect(variables.where).toEqual({ _and: [{ network: { _eq: NETWORK } }] });
    expect(variables.orderBy).toEqual(expect.arrayContaining([{ chain_id: 'asc' }]));
    if (domain !== 'indexedHeads') {
      expect(variables.orderBy).toEqual(expect.arrayContaining([{ id: 'asc' }]));
    }
  });

  it('uses complete EVM positions for default projection recency', () => {
    expect(buildV3DomainVariables('profiles', { network: NETWORK }).orderBy).toEqual([
      { last_block_number: 'desc' },
      { last_transaction_index: 'desc_nulls_last' },
      { last_log_index: 'desc_nulls_last' },
      { chain_id: 'asc' },
      { id: 'asc' },
    ]);
  });

  it('maps neutral filters, bigint values, addresses, null ordering, and logical operators', () => {
    expect(
      buildV3DomainVariables('ownedAssets', {
        network: NETWORK,
        filter: {
          and: [
            { ownerAddress: { eq: ADDRESS.toUpperCase().replace('0X', '0x') } },
            { balance: { gte: 10n } },
          ],
          not: { balance: { isNull: true } },
        },
        sort: [{ field: 'balance', direction: 'desc', nulls: 'last' }],
        limit: 25,
        offset: 50,
      }),
    ).toEqual({
      where: {
        _and: [
          { network: { _eq: NETWORK } },
          {
            _and: [{ owner_address: { _eq: ADDRESS } }, { balance: { _gte: '10' } }],
            _not: { balance: { _is_null: true } },
          },
        ],
      },
      orderBy: [{ balance: 'desc_nulls_last' }, { chain_id: 'asc' }, { id: 'asc' }],
      limit: 25,
      offset: 50,
    });
  });

  it('encodes metadata content length as a GraphQL Int and exposes current revisions', () => {
    expect(
      buildV3DomainVariables('metadataRevisions', {
        network: NETWORK,
        filter: { contentLength: { gte: 123 }, isCurrent: { eq: true } },
      }).where,
    ).toEqual({
      _and: [
        { network: { _eq: NETWORK } },
        { content_length: { _gte: 123 }, is_current: { _eq: true } },
      ],
    });
  });

  it.each(invalidVariableCases)(
    'returns typed validation errors for invalid controls',
    (params, path) => {
      expect(() => buildV3DomainVariables('blocks', params)).toThrow(IndexerError);
      try {
        buildV3DomainVariables('blocks', params);
      } catch (error) {
        expect(error).toMatchObject({ category: 'VALIDATION', code: 'VALIDATION_FAILED' });
        expect(error).toHaveProperty('validationErrors.0.path', path);
      }
    },
  );

  it.each([
    ['blocks', { network: NETWORK, filter: { missing: { eq: 1 } } }, 'filter.missing'],
    [
      'blocks',
      { network: NETWORK, sort: [{ field: 'missing', direction: 'asc' }] },
      'sort.missing',
    ],
    ['blocks', { network: NETWORK, filter: { hash: { eq: 'not-a-hash' } } }, 'filter.hash.eq'],
    ['blocks', { network: NETWORK, filter: { hash: { in: 'not-an-array' } } }, 'filter.hash.in'],
    ['blocks', { network: NETWORK, filter: { hash: { isNull: 'yes' } } }, 'filter.hash.isNull'],
    ['blocks', { network: NETWORK, filter: '' }, 'filter'],
    [
      'blocks',
      { network: NETWORK, filter: { number: { eq: Number.MAX_SAFE_INTEGER + 1 } } },
      'filter.number.eq',
    ],
    [
      'blocks',
      { network: NETWORK, sort: [{ field: 'number', direction: 'sideways' }] },
      'sort.direction',
    ],
    ['nfts', { network: NETWORK, filter: { isBurned: { gt: false } } }, 'filter.isBurned.gt'],
    [
      'metadataRevisions',
      { network: NETWORK, filter: { sourceRevision: { eq: '1' } } },
      'filter.sourceRevision.eq',
    ],
  ] as const)(
    'rejects invalid %s variables received from plain JavaScript',
    (domain, params, path) => {
      expect(() => buildVariablesFromJavascript(domain, params)).toThrow(IndexerError);
      try {
        buildVariablesFromJavascript(domain, params);
      } catch (error) {
        expect(error).toHaveProperty('validationErrors.0.path', path);
      }
    },
  );
});

describe('v3 API services', () => {
  it.each(fetchCases)('parses %s query results', async (_domain, fetcher, row) => {
    executeMock.mockResolvedValue({ items: [row], total: { aggregate: { count: 7 } } });
    await expect(fetcher(URL, { network: NETWORK })).resolves.toMatchObject({
      totalCount: 7,
      items: [{ network: NETWORK, chainId: 42 }],
    });
  });

  it('exports one fetcher for every public domain', () => {
    expect(Object.keys(v3Api)).toEqual(domains);
  });

  it.each(fetchCases)(
    'dispatches %s through the uniform framework adapter',
    async (domain, _, row) => {
      executeMock.mockResolvedValue({ items: [row], total: { aggregate: { count: 1 } } });
      await expect(fetchV3Domain(URL, domain, { network: NETWORK })).resolves.toMatchObject({
        items: [{ network: NETWORK }],
        totalCount: 1,
      });
    },
  );

  it('returns one indexed head or null', async () => {
    executeMock
      .mockResolvedValueOnce({
        items: [directRows.indexedHeads],
        total: { aggregate: { count: 1 } },
      })
      .mockResolvedValueOnce({ items: [], total: { aggregate: { count: 0 } } });
    await expect(fetchIndexedHead(URL, { network: NETWORK })).resolves.toMatchObject({
      chainId: 42,
    });
    await expect(fetchIndexedHead(URL, { network: NETWORK })).resolves.toBeNull();
  });

  it('wraps invalid server rows as parse errors with query context', async () => {
    executeMock.mockResolvedValue({ items: [{ network: NETWORK }], total: { aggregate: null } });
    await expect(fetchV3Blocks(URL, { network: NETWORK })).rejects.toMatchObject({
      category: 'PARSE',
      code: 'PARSE_FAILED',
      query: expect.stringContaining('query V3Blocks'),
    });
  });
});

describe('v3 clients, keys, and subscriptions', () => {
  it('keeps identical identities isolated across network cache keys', () => {
    const lukso = profileKeys.detail('lukso-mainnet', ADDRESS, { name: true });
    const ethereum = profileKeys.detail('ethereum-mainnet', ADDRESS, { name: true });
    expect(lukso).not.toEqual(ethereum);
    expect(collectionAttributeKeys.list(NETWORK, ADDRESS)).toContain(NETWORK);
    expect(
      v3Keys.list('profiles', {
        network: NETWORK,
        filter: { address: { eq: ADDRESS } },
      }),
    ).toContain(NETWORK);
    const bigintKey = v3Keys.list('ownedAssets', {
      network: NETWORK,
      filter: { balance: { gte: 10n } },
    });
    expect(() => JSON.stringify(bigintKey)).not.toThrow();
    expect(bigintKey).toEqual(
      expect.arrayContaining([expect.objectContaining({ filter: { balance: { gte: '10' } } })]),
    );
    expect(
      v3Keys.infinite('profiles', {
        network: NETWORK,
        filter: { address: { eq: ADDRESS } },
        pageSize: 25,
      }),
    ).toEqual(
      expect.arrayContaining([
        NETWORK,
        'profiles',
        'infinite',
        expect.objectContaining({ pageSize: 25 }),
      ]),
    );
  });

  it('network-scopes every familiar domain key factory', () => {
    for (const factory of Object.values(domainKeyFactories)) {
      for (const value of Object.values(factory)) {
        if (typeof value !== 'function') continue;
        const key: unknown = Reflect.apply(value, undefined, [
          NETWORK,
          ADDRESS,
          ADDRESS,
          { field: 'id' },
          10,
          0,
          { profile: true },
        ]);
        expect(key).toEqual(expect.arrayContaining(['lsp-indexer', 'v3', NETWORK]));
      }
    }
  });

  it('creates a validated network-scoped client and derives its WebSocket URL', async () => {
    executeMock.mockResolvedValue({
      items: [directRows.blocks],
      total: { aggregate: { count: 1 } },
    });
    const client = createIndexerClient({ url: URL, network: NETWORK });
    expect(client.url).toBe(URL);
    expect(client.wsUrl).toBe('wss://indexer.example/v1/graphql');
    await expect(client.blocks({ limit: 1 })).resolves.toMatchObject({ totalCount: 1 });
    expect(executeMock.mock.calls[0]?.[2]).toMatchObject({
      where: { _and: [{ network: { _eq: NETWORK } }] },
      limit: 1,
    });
    client.dispose();
  });

  it('exposes every v3 domain through the network-scoped client', async () => {
    const client = createIndexerClient({ url: URL, network: NETWORK });
    for (const [domain, , row] of fetchCases) {
      executeMock.mockResolvedValueOnce({ items: [row], total: { aggregate: { count: 1 } } });
      const method: unknown = Reflect.get(client, domain);
      if (typeof method !== 'function') throw new Error(`missing client method for ${domain}`);
      const result: unknown = await Reflect.apply(method, client, [{}]);
      expect(result).toMatchObject({ items: [{ network: NETWORK }], totalCount: 1 });
    }

    executeMock.mockResolvedValueOnce({
      items: [directRows.indexedHeads],
      total: { aggregate: { count: 1 } },
    });
    await expect(client.indexedHead()).resolves.toMatchObject({ network: NETWORK });
    const subscription = client.subscribe('blocks', {}, { enabled: false });
    expect(subscription.isSubscribed).toBe(false);
    subscription.dispose();
    client.dispose();
  });

  it('rejects invalid client configuration as IndexerError', () => {
    expect(() => createIndexerClient({ url: 'ftp://example.com', network: NETWORK })).toThrow(
      IndexerError,
    );
    expect(() => createIndexerClient({ url: URL, network: 'Invalid Network' })).toThrow(
      IndexerError,
    );
    expect(() =>
      createIndexerClient({ url: URL, network: NETWORK, wsUrl: 'https://example.com' }),
    ).toThrow(IndexerError);
  });

  it.each(fetchCases)('builds and parses the %s live-query contract', (domain, _fetcher, row) => {
    const config = buildV3SubscriptionConfig(domain, { network: NETWORK, limit: 2 });
    expect(config.document.toString()).toContain('subscription V3');
    expect(config.variables).toMatchObject({
      where: { _and: [{ network: { _eq: NETWORK } }] },
      limit: 2,
    });
    expect(config.parser(config.extract({ items: [row] }))).toMatchObject([
      { network: NETWORK, chainId: 42 },
    ]);
  });
});
