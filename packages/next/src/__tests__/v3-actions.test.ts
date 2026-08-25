import { afterEach, describe, expect, it, vi } from 'vitest';
import { getIndexedHead, getV3Blocks, getV3Domain } from '../actions';

const NETWORK = 'lukso-mainnet';
const URL = 'https://indexer.example/v1/graphql';

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.INDEXER_URL;
});

describe('v3 Next.js server actions', () => {
  it('forwards an exact network through the shared Node transport', async () => {
    process.env.INDEXER_URL = URL;
    const fetchMock = vi.fn<typeof fetch>(async () =>
      Promise.resolve(
        new Response(JSON.stringify({ data: { items: [], total: { aggregate: { count: 0 } } } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(getV3Blocks({ network: NETWORK, limit: 10 })).resolves.toEqual({
      items: [],
      totalCount: 0,
    });

    const request = fetchMock.mock.calls[0]?.[1];
    const body = request?.body;
    if (typeof body !== 'string') throw new TypeError('Expected a string GraphQL request body');
    expect(body).toContain(`"network":{"_eq":"${NETWORK}"}`);
    expect(body).toContain('"limit":10');
  });

  it('rejects invalid action inputs before making a request', async () => {
    process.env.INDEXER_URL = URL;
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchMock);

    await expect(getV3Blocks({ network: NETWORK, limit: 0 })).rejects.toMatchObject({
      category: 'VALIDATION',
      code: 'VALIDATION_FAILED',
    });
    await expect(
      Reflect.apply(getV3Domain, undefined, ['missing', { network: NETWORK }]),
    ).rejects.toMatchObject({ category: 'VALIDATION' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns null when the selected network has no indexed head', async () => {
    process.env.INDEXER_URL = URL;
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () =>
        Promise.resolve(
          new Response(
            JSON.stringify({ data: { items: [], total: { aggregate: { count: 0 } } } }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        ),
      ),
    );

    await expect(getIndexedHead({ network: NETWORK })).resolves.toBeNull();
  });
});
