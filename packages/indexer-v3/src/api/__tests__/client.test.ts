import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  applyHasuraMetadata,
  assertHasuraMetadataConsistent,
  fetchPublicHasuraSchema,
} from '../client.js';
import type { HasuraApiConfig } from '../config.js';
import { createHasuraMetadata } from '../metadata.js';

const config: HasuraApiConfig = {
  metadataEndpoint: 'https://hasura.example.test/v1/metadata',
  graphqlEndpoint: 'https://hasura.example.test/v1/graphql',
  adminSecret: 'operator-secret',
  timeoutMs: 1_000,
};

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function requestBody(fetchMock: ReturnType<typeof vi.fn<typeof fetch>>, index: number): unknown {
  const body = fetchMock.mock.calls[index]?.[1]?.body;
  if (typeof body !== 'string') throw new Error(`Expected request ${index} to have a JSON body`);
  const parsed: unknown = JSON.parse(body);
  return parsed;
}

afterEach(() => vi.unstubAllGlobals());

describe('Hasura metadata client', () => {
  it('replaces only the v3 source at the exported resource version', async () => {
    const existingSource = {
      name: 'existing',
      kind: 'postgres',
      tables: [],
      configuration: { connection_info: { database_url: { from_env: 'EXISTING_URL' } } },
    };
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({
          resource_version: 17,
          metadata: {
            version: 3,
            sources: [existingSource],
            remote_schemas: [{ name: 'preserved', definition: { url: 'https://remote.test' } }],
          },
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ is_consistent: true }));
    vi.stubGlobal('fetch', fetchMock);

    await applyHasuraMetadata(config);

    expect(requestBody(fetchMock, 0)).toEqual({ type: 'export_metadata', version: 2, args: {} });
    expect(requestBody(fetchMock, 1)).toEqual({
      type: 'replace_metadata',
      version: 2,
      resource_version: 17,
      args: {
        allow_inconsistent_metadata: false,
        metadata: {
          version: 3,
          sources: [existingSource, createHasuraMetadata().metadata.sources[0]],
          remote_schemas: [{ name: 'preserved', definition: { url: 'https://remote.test' } }],
        },
      },
    });
  });

  it('updates an existing v3 source without changing its position', async () => {
    const existingSource = { name: 'existing', kind: 'postgres', tables: [] };
    const staleV3Source = { name: 'v3', kind: 'postgres', tables: [{ table: 'stale' }] };
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({
          resource_version: 4,
          metadata: { version: 3, sources: [staleV3Source, existingSource] },
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ is_consistent: true }));
    vi.stubGlobal('fetch', fetchMock);

    await applyHasuraMetadata(config);

    expect(requestBody(fetchMock, 1)).toEqual({
      type: 'replace_metadata',
      version: 2,
      resource_version: 4,
      args: {
        allow_inconsistent_metadata: false,
        metadata: {
          version: 3,
          sources: [createHasuraMetadata().metadata.sources[0], existingSource],
        },
      },
    });
  });

  it('rejects malformed exports before changing metadata', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ metadata: { version: 3, sources: [] } }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(applyHasuraMetadata(config)).rejects.toThrow(
      'Hasura metadata export omitted a valid resource version',
    );
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it.each([
    [null, 'Hasura returned an invalid metadata export'],
    [
      { resource_version: 1, metadata: { version: 2, sources: [] } },
      'Hasura metadata export is not a version 3 metadata document',
    ],
    [
      { resource_version: 1, metadata: { version: 3, sources: [{}] } },
      'Hasura metadata export contains an invalid source',
    ],
    [
      {
        resource_version: 1,
        metadata: { version: 3, sources: [{ name: 'v3' }, { name: 'v3' }] },
      },
      'Hasura metadata contains duplicate v3 sources',
    ],
  ])('rejects an unsafe metadata export before replacement', async (exported, error) => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(jsonResponse(exported));
    vi.stubGlobal('fetch', fetchMock);

    await expect(applyHasuraMetadata(config)).rejects.toThrow(error);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('reports stable HTTP and Hasura error details', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse(
          { message: 'metadata resource version changed', extensions: { code: 'conflict' } },
          409,
        ),
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(applyHasuraMetadata(config)).rejects.toThrow(
      'Hasura request failed with HTTP 409: metadata resource version changed (conflict)',
    );
  });

  it('reports a stable error for non-JSON Hasura responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(new Response('<html>unavailable</html>', { status: 503 })),
    );

    await expect(applyHasuraMetadata(config)).rejects.toThrow(
      'Hasura returned a non-JSON response with HTTP 503',
    );
  });

  it('reports inconsistent metadata without hiding Hasura details', async () => {
    const inconsistent = [{ type: 'source', name: 'v3', reason: 'connection refused' }];
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(
          jsonResponse({ is_consistent: false, inconsistent_objects: inconsistent }),
        ),
    );

    await expect(assertHasuraMetadataConsistent(config)).rejects.toThrow(
      `Hasura v3 metadata is inconsistent: ${JSON.stringify(inconsistent)}`,
    );
  });

  it('reports public-schema GraphQL errors with stable extension codes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValueOnce(
        jsonResponse({
          errors: [{ message: 'introspection denied', extensions: { code: 'denied' } }],
        }),
      ),
    );

    await expect(fetchPublicHasuraSchema(config)).rejects.toThrow(
      'Hasura introspection failed: introspection denied (denied)',
    );
  });
});
