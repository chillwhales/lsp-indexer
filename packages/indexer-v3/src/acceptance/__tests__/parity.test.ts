import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  SHADOW_PARITY_DOMAINS,
  compareShadowDomain,
  loadShadowParityConfig,
  requestGraphql,
  runShadowParity,
  type GraphqlRequester,
  type ShadowParityConfig,
  type ShadowParityDomain,
} from '../parity.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

const config: ShadowParityConfig = {
  sourceUrl: 'https://v2.example.test/v1/graphql',
  targetUrl: 'https://v3.example.test/v1/graphql',
  network: 'lukso-mainnet',
  expectedFinalizedBlock: 100,
  pageSize: 1,
  maxRowsPerDomain: 10,
  timeoutMs: 1_000,
};

const domain: ShadowParityDomain = {
  name: 'balances',
  source: { root: 'owned_asset', order: ['owner', 'address'] },
  target: { root: 'owned_asset', order: ['owner_address', 'asset_address'] },
  fields: [
    { name: 'owner', source: 'owner', target: 'owner_address', kind: 'address' },
    { name: 'asset', source: 'address', target: 'asset_address', kind: 'address' },
    { name: 'balance', source: 'balance', target: 'balance', kind: 'integer' },
  ],
};

function createRequester(targetBalance = '1'): GraphqlRequester {
  const sourceRows = [
    { owner: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', address: '0x01', balance: '01' },
    { owner: '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', address: '0x02', balance: '2' },
  ];
  const targetRows = [
    {
      owner_address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      asset_address: '0x01',
      balance: targetBalance,
    },
    {
      owner_address: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      asset_address: '0x02',
      balance: '2',
    },
  ];
  return (endpoint, _secret, query, variables): Promise<Record<string, unknown>> => {
    if (query.includes('aggregate:')) {
      return Promise.resolve({ aggregate: { aggregate: { count: 2 } } });
    }
    const offset = Number(variables.offset);
    const rows = endpoint.includes('v2') ? sourceRows : targetRows;
    return Promise.resolve({ rows: rows.slice(offset, offset + 1) });
  };
}

function createSingleRowRequester(
  sourceRow: Record<string, unknown>,
  targetRow: Record<string, unknown>,
): GraphqlRequester {
  return (endpoint, _secret, query): Promise<Record<string, unknown>> => {
    if (query.includes('aggregate:')) {
      return Promise.resolve({ aggregate: { aggregate: { count: 1 } } });
    }
    return Promise.resolve({ rows: [endpoint.includes('v2') ? sourceRow : targetRow] });
  };
}

interface MalformedScalarCase {
  kind: ShadowParityDomain['fields'][number]['kind'];
  source: unknown;
  target: unknown;
  error: string;
}

async function expectMalformedScalar(candidate: MalformedScalarCase): Promise<void> {
  const malformedDomain: ShadowParityDomain = {
    name: `malformed-${candidate.kind}`,
    source: { root: 'source', order: ['value'] },
    target: { root: 'target', order: ['value'] },
    fields: [{ name: 'value', source: 'value', target: 'value', kind: candidate.kind }],
  };
  await expect(
    compareShadowDomain(
      config,
      malformedDomain,
      createSingleRowRequester({ value: candidate.source }, { value: candidate.target }),
    ),
  ).rejects.toThrow(candidate.error);
}

describe('shadow parity acceptance', () => {
  it('loads a strict same-height configuration', () => {
    expect(
      loadShadowParityConfig({
        V2_GRAPHQL_ENDPOINT: 'https://v2.example.test/v1/graphql',
        V3_GRAPHQL_ENDPOINT: 'https://v3.example.test/v1/graphql',
        ACCEPTANCE_NETWORK: 'lukso-mainnet',
        ACCEPTANCE_FINALIZED_BLOCK: '123',
      }),
    ).toMatchObject({
      network: 'lukso-mainnet',
      expectedFinalizedBlock: 123,
      pageSize: 1_000,
      maxRowsPerDomain: 1_000_000,
    });
  });

  it('validates endpoints, credentials, required values, and positive limits', () => {
    const valid = {
      V2_GRAPHQL_ENDPOINT: 'https://v2.example.test/v1/graphql',
      V3_GRAPHQL_ENDPOINT: 'https://v3.example.test/v1/graphql',
      ACCEPTANCE_NETWORK: 'lukso-mainnet',
      ACCEPTANCE_FINALIZED_BLOCK: '123',
    };

    expect(() => loadShadowParityConfig({ ...valid, ACCEPTANCE_NETWORK: ' ' })).toThrow(
      'ACCEPTANCE_NETWORK is required',
    );
    expect(() => loadShadowParityConfig({ ...valid, V2_GRAPHQL_ENDPOINT: '' })).toThrow(
      'V2_GRAPHQL_ENDPOINT is required',
    );
    expect(() => loadShadowParityConfig({ ...valid, V2_GRAPHQL_ENDPOINT: 'not-a-url' })).toThrow(
      'must be an absolute HTTP(S) URL',
    );
    expect(() =>
      loadShadowParityConfig({ ...valid, V2_GRAPHQL_ENDPOINT: 'ftp://example.test' }),
    ).toThrow('must use HTTP or HTTPS');
    expect(() =>
      loadShadowParityConfig({
        ...valid,
        V2_GRAPHQL_ENDPOINT: 'https://user:secret@example.test/graphql',
      }),
    ).toThrow('must not contain credentials');
    expect(() => loadShadowParityConfig({ ...valid, ACCEPTANCE_FINALIZED_BLOCK: '0' })).toThrow(
      'must be a positive safe integer',
    );
    expect(() => loadShadowParityConfig({ ...valid, ACCEPTANCE_FINALIZED_BLOCK: '' })).toThrow(
      'ACCEPTANCE_FINALIZED_BLOCK is required',
    );

    expect(
      loadShadowParityConfig({
        ...valid,
        V2_GRAPHQL_ADMIN_SECRET: ' source-secret ',
        V3_GRAPHQL_ADMIN_SECRET: ' target-secret ',
        ACCEPTANCE_PAGE_SIZE: '25',
        ACCEPTANCE_MAX_ROWS_PER_DOMAIN: '50',
        ACCEPTANCE_REQUEST_TIMEOUT_MS: '75',
      }),
    ).toMatchObject({
      sourceSecret: 'source-secret',
      targetSecret: 'target-secret',
      pageSize: 25,
      maxRowsPerDomain: 50,
      timeoutMs: 75,
    });
  });

  it('normalizes mapped fields and compares every paginated row', async () => {
    await expect(compareShadowDomain(config, domain, createRequester())).resolves.toEqual({
      domain: 'balances',
      sourceCount: 2,
      targetCount: 2,
      comparedRows: 4,
      truncated: false,
      differences: [],
      passed: true,
    });
  });

  it('preserves empty strings as distinct shared-field values', async () => {
    const stringDomain: ShadowParityDomain = {
      name: 'names',
      source: { root: 'source_name', order: ['value'] },
      target: { root: 'target_name', order: ['value'] },
      fields: [{ name: 'value', source: 'value', target: 'value', kind: 'string' }],
    };

    await expect(
      compareShadowDomain(
        config,
        stringDomain,
        createSingleRowRequester({ value: '' }, { value: null }),
      ),
    ).resolves.toMatchObject({
      passed: false,
      differences: [
        { row: { value: '' }, sourceOccurrences: 1, targetOccurrences: 0 },
        { row: { value: null }, sourceOccurrences: 0, targetOccurrences: 1 },
      ],
    });
  });

  it('normalizes collapsed v2 enums, CompactBytesArray values, and v3 JSON arrays', async () => {
    const scalarDomain: ShadowParityDomain = {
      name: 'controller-scalars',
      source: { root: 'controller', order: ['address'] },
      target: { root: 'controller', order: ['address'] },
      fields: [
        { name: 'tokenType', source: 'token_type', target: 'token_type', kind: 'token-type' },
        {
          name: 'tokenIdFormat',
          source: 'token_id_format',
          target: 'token_id_format',
          kind: 'token-id-format',
        },
        {
          name: 'allowedCalls',
          source: 'allowed_calls',
          target: 'allowed_calls',
          kind: 'compact-bytes',
        },
      ],
    };
    const requester: GraphqlRequester = (endpoint, _secret, query) => {
      if (query.includes('aggregate:')) {
        return Promise.resolve({ aggregate: { aggregate: { count: 1 } } });
      }
      return Promise.resolve(
        endpoint.includes('v2')
          ? {
              rows: [
                {
                  token_type: 'COLLECTION',
                  token_id_format: 'BYTES32',
                  allowed_calls: '0x0002AABB0001CC',
                },
              ],
            }
          : {
              rows: [
                {
                  token_type: 2,
                  token_id_format: 104,
                  allowed_calls: ['0xaabb', '0xcc'],
                },
              ],
            },
      );
    };

    await expect(compareShadowDomain(config, scalarDomain, requester)).resolves.toMatchObject({
      differences: [],
      passed: true,
    });
  });

  it('rejects malformed primitive shared scalar representations', async () => {
    const cases: MalformedScalarCase[] = [
      { kind: 'boolean', source: 'true', target: true, error: 'must be a boolean' },
      { kind: 'integer', source: 'not-an-integer', target: '1', error: 'must be an integer' },
      { kind: 'string', source: {}, target: 'value', error: 'must be a scalar' },
      { kind: 'token-type', source: 'UNKNOWN', target: 0, error: 'supported token type' },
      {
        kind: 'token-id-format',
        source: 'UNKNOWN',
        target: 0,
        error: 'supported token ID format',
      },
    ];

    for (const candidate of cases) await expectMalformedScalar(candidate);
  });

  it('rejects malformed CompactBytesArray representations', async () => {
    const cases: MalformedScalarCase[] = [
      {
        kind: 'compact-bytes',
        source: 'invalid',
        target: [],
        error: 'CompactBytesArray hex value or string array',
      },
      {
        kind: 'compact-bytes',
        source: '0x00',
        target: [],
        error: 'truncated length prefix',
      },
      {
        kind: 'compact-bytes',
        source: '0x0002AA',
        target: [],
        error: 'truncated entry',
      },
      {
        kind: 'compact-bytes',
        source: '0x',
        target: [1],
        error: 'must contain only strings',
      },
    ];

    for (const candidate of cases) await expectMalformedScalar(candidate);
  });

  it('covers shared owners, controller permissions, and asset scalar domains', () => {
    expect(SHADOW_PARITY_DOMAINS.map(({ name }) => name)).toEqual(
      expect.arrayContaining([
        'profile-owners',
        'digital-asset-owners',
        'controllers',
        'token-type',
        'token-id-format',
        'token-id-reference-contract',
        'token-metadata-base-uri',
      ]),
    );
    expect(
      SHADOW_PARITY_DOMAINS.find(({ name }) => name === 'controllers')?.fields.map(
        ({ name }) => name,
      ),
    ).toEqual(expect.arrayContaining(['permissions', 'allowedCalls', 'allowedDataKeys']));
  });

  it('reports shared-field differences', async () => {
    const report = await compareShadowDomain(config, domain, createRequester('3'));

    expect(report.passed).toBe(false);
    expect(report.differences).toEqual([
      {
        row: {
          owner: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          asset: '0x01',
          balance: '1',
        },
        sourceOccurrences: 1,
        targetOccurrences: 0,
      },
      {
        row: {
          owner: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          asset: '0x01',
          balance: '3',
        },
        sourceOccurrences: 0,
        targetOccurrences: 1,
      },
    ]);
  });

  it('fails closed on row ceilings and malformed GraphQL result shapes', async () => {
    const truncatedRequester: GraphqlRequester = (_endpoint, _secret, query) => {
      if (query.includes('aggregate:')) {
        return Promise.resolve({ aggregate: { aggregate: { count: 2 } } });
      }
      throw new Error('rows must not be requested after truncation');
    };
    await expect(
      compareShadowDomain({ ...config, maxRowsPerDomain: 1 }, domain, truncatedRequester),
    ).resolves.toMatchObject({ truncated: true, passed: false, comparedRows: 0 });

    const invalidAggregate: GraphqlRequester = () => Promise.resolve({});
    await expect(compareShadowDomain(config, domain, invalidAggregate)).rejects.toThrow(
      'aggregate response is missing aggregate data',
    );

    const invalidCount: GraphqlRequester = () =>
      Promise.resolve({ aggregate: { aggregate: { count: -1 } } });
    await expect(compareShadowDomain(config, domain, invalidCount)).rejects.toThrow(
      'aggregate count is invalid',
    );

    const shortPage: GraphqlRequester = (_endpoint, _secret, query) =>
      Promise.resolve(
        query.includes('aggregate:') ? { aggregate: { aggregate: { count: 1 } } } : { rows: [] },
      );
    await expect(compareShadowDomain(config, domain, shortPage)).rejects.toThrow(
      'returned 0 rows at offset 0; expected 1',
    );

    const invalidRows: GraphqlRequester = (_endpoint, _secret, query) =>
      Promise.resolve(
        query.includes('aggregate:')
          ? { aggregate: { aggregate: { count: 1 } } }
          : { rows: [null] },
      );
    await expect(compareShadowDomain(config, domain, invalidRows)).rejects.toThrow(
      'row response is invalid',
    );
  });

  it('validates HTTP and GraphQL protocol failures without leaking secrets into URLs', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([])))
      .mockResolvedValueOnce(new Response(JSON.stringify({ errors: [{ message: 'denied' }] })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ errors: [{}] })))
      .mockResolvedValueOnce(new Response(JSON.stringify({})))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { ok: true } })));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      requestGraphql('https://api.example.test', undefined, 'query A', {}, 10),
    ).rejects.toThrow('HTTP 503');
    await expect(
      requestGraphql('https://api.example.test', undefined, 'query B', {}, 10),
    ).rejects.toThrow('invalid response');
    await expect(
      requestGraphql('https://api.example.test', undefined, 'query C', {}, 10),
    ).rejects.toThrow('denied');
    await expect(
      requestGraphql('https://api.example.test', undefined, 'query D', {}, 10),
    ).rejects.toThrow('unknown');
    await expect(
      requestGraphql('https://api.example.test', undefined, 'query E', {}, 10),
    ).rejects.toThrow('missing data');
    await expect(
      requestGraphql('https://api.example.test', 'admin-secret', 'query F', {}, 10),
    ).resolves.toEqual({ ok: true });

    expect(fetchMock.mock.calls[5]?.[0]).toBe('https://api.example.test');
    expect(fetchMock.mock.calls[5]?.[1]?.headers).toMatchObject({
      'x-hasura-admin-secret': 'admin-secret',
    });
  });

  it('refuses to compare an endpoint that is not frozen at the requested finalized height', async () => {
    const requester: GraphqlRequester = () =>
      Promise.resolve({ rows: [{ block_number: '101', finalized_block_number: '100' }] });

    await expect(runShadowParity(config, requester)).rejects.toThrow(
      'V3 must be frozen and finalized at block 100; indexed=101, finalized=100',
    );
  });

  it('rejects absent or malformed v3 heads and can compare every empty domain', async () => {
    const absentHead: GraphqlRequester = () => Promise.resolve({ rows: [] });
    await expect(runShadowParity(config, absentHead)).rejects.toThrow('No v3 indexed head exists');

    const malformedHead: GraphqlRequester = () =>
      Promise.resolve({ rows: [{ block_number: 'invalid', finalized_block_number: '100' }] });
    await expect(runShadowParity(config, malformedHead)).rejects.toThrow('invalid block numbers');

    const emptyRequester: GraphqlRequester = (_endpoint, _secret, query) => {
      if (query.includes('AcceptanceHead')) {
        return Promise.resolve({ rows: [{ block_number: '100', finalized_block_number: '100' }] });
      }
      if (query.includes('aggregate:')) {
        return Promise.resolve({ aggregate: { aggregate: { count: 0 } } });
      }
      throw new Error('zero-count domains must not request rows');
    };
    const report = await runShadowParity(config, emptyRequester);
    expect(report).toMatchObject({
      passed: true,
    });
    expect(report.domains).toMatchObject(
      SHADOW_PARITY_DOMAINS.map(({ name }) => ({
        domain: name,
        comparedRows: 0,
        passed: true,
      })),
    );
  });
});
