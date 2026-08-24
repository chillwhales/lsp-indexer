import { createServer } from 'node:http';
import { keccak256, toHex } from 'viem';
import { describe, expect, it, vi } from 'vitest';
import {
  fetchMetadata,
  requestPinnedAddress,
  resolveMetadataRequestUrl,
  type MetadataFetchConfig,
  type MetadataFetchResult,
  type MetadataRequestImplementation,
} from '../fetch.js';
import type { MetadataSource } from '../source.js';

const content = { LSP3Profile: { name: 'Alice' } };
const body = JSON.stringify(content);
const bodyHash = keccak256(toHex(body));

function createSource(overrides: Partial<MetadataSource> = {}): MetadataSource {
  const contentUri = overrides.contentUri ?? 'https://metadata.example.test/profile.json';
  return {
    id: 'metadata-id',
    network: 'lukso-mainnet',
    chainId: 42,
    kind: 'lsp3_profile',
    address: '0x0000000000000000000000000000000000000010',
    tokenId: null,
    dataKey: toHex(1n, { size: 32 }),
    sourceRevision: toHex(2n, { size: 32 }),
    contentUri,
    contentUris: overrides.contentUris ?? [contentUri],
    contentHash: bodyHash,
    verificationMethod: '0x8019f9b1',
    eligibleBlockNumber: 100,
    eligibleBlockHash: toHex(100n, { size: 32 }),
    refreshEligibility: false,
    lastBlockNumber: 100,
    lastBlockHash: toHex(100n, { size: 32 }),
    lastTransactionHash: toHex(200n, { size: 32 }),
    lastTransactionIndex: 1,
    lastLogIndex: 2,
    ...overrides,
  };
}

function mockFetch(responses: readonly (Response | Error)[]): {
  fetchImplementation: MetadataRequestImplementation;
  urls: string[];
  addresses: string[];
} {
  const urls: string[] = [];
  const addresses: string[] = [];
  let index = 0;
  const fetchImplementation: MetadataRequestImplementation = (url, address): Promise<Response> => {
    urls.push(url.toString());
    addresses.push(address.address);
    const response = responses[index++];
    if (response == null) return Promise.reject(new Error('Unexpected metadata request'));
    if (response instanceof Error) return Promise.reject(response);
    return Promise.resolve(response);
  };
  return { fetchImplementation, urls, addresses };
}

function createConfig(requestImplementation: MetadataRequestImplementation): MetadataFetchConfig {
  return {
    ipfsGateways: ['https://gateway.example.test/ipfs'],
    allowHttp: false,
    requestTimeoutMs: 1_000,
    maxResponseBytes: 1_024,
    maxRedirects: 2,
    requestImplementation,
    lookupImplementation: () => Promise.resolve([{ address: '93.184.216.34', family: 4 }]),
  };
}

async function expectFetchFailure(
  resultPromise: Promise<MetadataFetchResult>,
  message: string,
  retryable?: boolean,
): Promise<void> {
  const result = await resultPromise;
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error('Expected metadata request failure');
  expect(result.error).toContain(message);
  if (retryable != null) expect(result.retryable).toBe(retryable);
}

describe('metadata transport', () => {
  it('requests identity encoding through the production pinned transport', async () => {
    let acceptedEncoding: string | undefined;
    const server = createServer((request, response): void => {
      acceptedEncoding = request.headers['accept-encoding'];
      response.setHeader('content-type', 'application/json');
      response.end(body);
    });
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });

    try {
      const serverAddress = server.address();
      if (serverAddress == null || typeof serverAddress === 'string') {
        throw new Error('Expected a local TCP server address');
      }
      const response = await requestPinnedAddress(
        new URL(`http://metadata.example.test:${serverAddress.port}/profile.json`),
        { address: '127.0.0.1', family: 4 },
        { deadline: performance.now() + 1_000, maxResponseBytes: 1_024 },
      );

      expect(await response.text()).toBe(body);
      expect(acceptedEncoding).toBe('identity');
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error): void => {
          if (error == null) resolve();
          else reject(error);
        });
      });
    }
  });

  it('resolves public HTTP and IPFS sources while rejecting local targets', () => {
    expect(
      resolveMetadataRequestUrl('https://example.com/metadata', 'https://gateway.test/ipfs'),
    ).toBe('https://example.com/metadata');
    expect(resolveMetadataRequestUrl('ipfs://bafy/path.json', 'https://gateway.test/ipfs/')).toBe(
      'https://gateway.test/ipfs/bafy/path.json',
    );
    expect(() =>
      resolveMetadataRequestUrl('http://example.com/metadata', 'https://gateway.test/ipfs'),
    ).toThrow('disabled');
    expect(
      resolveMetadataRequestUrl('http://example.com/metadata', 'https://gateway.test/ipfs', true),
    ).toBe('http://example.com/metadata');

    for (const value of [
      'file:///tmp/metadata',
      'https://user:password@example.com/metadata',
      'http://localhost/metadata',
      'http://service.internal/metadata',
      'http://127.0.0.1/metadata',
      'http://10.0.0.1/metadata',
      'http://169.254.1.1/metadata',
      'http://172.16.0.1/metadata',
      'http://192.168.0.1/metadata',
      'https://224.0.0.1/metadata',
      'https://240.0.0.1/metadata',
      'https://[::1]/metadata',
      'https://[::ffff:127.0.0.1]/metadata',
      'https://[2002:7f00:1::]/metadata',
      'https://[2001:db8::1]/metadata',
      'https://[fd00::1]/metadata',
    ]) {
      expect(() => resolveMetadataRequestUrl(value, 'https://gateway.test/ipfs')).toThrow();
    }
    expect(() =>
      resolveMetadataRequestUrl('ipfs://../secret', 'https://gateway.test/ipfs'),
    ).toThrow('malformed');
    expect(() =>
      resolveMetadataRequestUrl('ipfs://bafy/%5c..%5csecret', 'https://gateway.test/ipfs'),
    ).toThrow('malformed');
    expect(() =>
      resolveMetadataRequestUrl('ipfs://bafy/%00secret', 'https://gateway.test/ipfs'),
    ).toThrow('malformed');
  });

  it('fetches, verifies, and parses LSP3 and LSP4 JSON through an IPFS gateway', async () => {
    const first = mockFetch([
      new Response(body, { headers: { 'content-type': 'application/json; charset=utf-8' } }),
    ]);
    const profileResult = await fetchMetadata(
      createSource({ contentUri: 'ipfs://bafy/profile.json' }),
      createConfig(first.fetchImplementation),
    );

    expect(first.urls).toEqual(['https://gateway.example.test/ipfs/bafy/profile.json']);
    expect(profileResult).toMatchObject({
      ok: true,
      content,
      contentUri: 'ipfs://bafy/profile.json',
      contentHash: bodyHash,
      contentType: 'application/json',
      contentLength: body.length,
    });

    const assetContent = { LSP4Metadata: { name: 'Collection' } };
    const assetBody = JSON.stringify(assetContent);
    const second = mockFetch([new Response(assetBody)]);
    await expect(
      fetchMetadata(
        createSource({
          kind: 'lsp4_asset',
          contentHash: null,
          verificationMethod: null,
        }),
        createConfig(second.fetchImplementation),
      ),
    ).resolves.toMatchObject({ ok: true, content: assetContent });
  });

  it('accepts bounded data URIs without opening a network connection', async () => {
    const mocked = mockFetch([new Error('network must not be used')]);
    const percentEncoded = await fetchMetadata(
      createSource({ contentUri: `data:application/json,${encodeURIComponent(body)}` }),
      createConfig(mocked.fetchImplementation),
    );
    const base64Encoded = await fetchMetadata(
      createSource({ contentUri: `data:application/json;base64,${btoa(body)}` }),
      createConfig(mocked.fetchImplementation),
    );

    expect(percentEncoded).toMatchObject({ ok: true, content, contentHash: bodyHash });
    expect(base64Encoded).toMatchObject({ ok: true, content, contentHash: bodyHash });
    expect(mocked.urls).toEqual([]);

    await expectFetchFailure(
      fetchMetadata(createSource({ contentUri: 'data:application/json;base64,%%%=' }), {
        ...createConfig(mocked.fetchImplementation),
        maxResponseBytes: 10,
      }),
      'invalid encoding',
      false,
    );
  });

  it('fails over across configured IPFS gateways and validated DNS addresses', async () => {
    const gateways = mockFetch([new Error('primary unavailable'), new Response(body)]);
    const gatewayResult = await fetchMetadata(createSource({ contentUri: 'ipfs://bafy/profile' }), {
      ...createConfig(gateways.fetchImplementation),
      ipfsGateways: [
        'https://primary-gateway.example.test/ipfs',
        'https://fallback-gateway.example.test/ipfs',
      ],
    });
    expect(gatewayResult).toMatchObject({ ok: true, content });
    expect(gateways.urls).toEqual([
      'https://primary-gateway.example.test/ipfs/bafy/profile',
      'https://fallback-gateway.example.test/ipfs/bafy/profile',
    ]);

    const addresses = mockFetch([new Error('first address unavailable'), new Response(body)]);
    const addressResult = await fetchMetadata(createSource(), {
      ...createConfig(addresses.fetchImplementation),
      lookupImplementation: () =>
        Promise.resolve([
          { address: '93.184.216.34', family: 4 },
          { address: '2606:2800:220:1:248:1893:25c8:1946', family: 6 },
        ]),
    });
    expect(addressResult).toMatchObject({ ok: true, content });
    expect(addresses.addresses).toEqual(['93.184.216.34', '2606:2800:220:1:248:1893:25c8:1946']);

    const timeoutAttempts: string[] = [];
    const timeoutResult = await fetchMetadata(createSource(), {
      ...createConfig((_url, currentAddress): Promise<Response> => {
        timeoutAttempts.push(currentAddress.address);
        return timeoutAttempts.length === 1
          ? new Promise<Response>(() => undefined)
          : Promise.resolve(new Response(body));
      }),
      requestTimeoutMs: 50,
      lookupImplementation: () =>
        Promise.resolve([
          { address: '2606:2800:220:1:248:1893:25c8:1946', family: 6 },
          { address: '93.184.216.34', family: 4 },
        ]),
    });
    expect(timeoutResult).toMatchObject({ ok: true, content });
    expect(timeoutAttempts).toEqual(['2606:2800:220:1:248:1893:25c8:1946', '93.184.216.34']);
  });

  it('fails over across every LSP31 location and records the location that succeeds', async () => {
    const fallback = mockFetch([new Response(null, { status: 503 }), new Response(body)]);
    const result = await fetchMetadata(
      createSource({
        contentUri: 'ipfs://primary/profile',
        contentUris: ['ipfs://primary/profile', 'https://arweave.net/fallback-profile'],
      }),
      createConfig(fallback.fetchImplementation),
    );

    expect(result).toMatchObject({
      ok: true,
      content,
      contentUri: 'https://arweave.net/fallback-profile',
    });
    expect(fallback.urls).toEqual([
      'https://gateway.example.test/ipfs/primary/profile',
      'https://arweave.net/fallback-profile',
    ]);
  });

  it('rejects source location counts outside the configured lease bound', async () => {
    const mocked = mockFetch([new Response(body)]);
    await expectFetchFailure(
      fetchMetadata(
        createSource({
          contentUris: Array.from(
            { length: 6 },
            (_, index) => `https://metadata.example.test/${index}.json`,
          ),
        }),
        createConfig(mocked.fetchImplementation),
      ),
      'between 1 and 5 locations',
      false,
    );
    expect(mocked.urls).toEqual([]);
  });

  it('validates LSP29 encrypted metadata with the package schema', async () => {
    const encrypted = {
      LSP29EncryptedAsset: {
        version: '2.0.0',
        id: 'premium-content',
        title: 'Premium content',
        revision: 1,
        images: [],
        file: { type: 'application/octet-stream', name: 'asset.bin', size: 12, hash: bodyHash },
        encryption: {
          provider: 'taco',
          method: 'time-locked',
          params: { method: 'time-locked', unlockTimestamp: '2027-01-01T00:00:00Z' },
          condition: {},
          encryptedKey: { messageKit: '0x1234' },
        },
        chunks: { ipfs: { cids: ['bafy-chunk'] }, iv: '0x1234', totalSize: 12 },
      },
    };
    const encryptedBody = JSON.stringify(encrypted);
    const mocked = mockFetch([new Response(encryptedBody)]);
    const result = await fetchMetadata(
      createSource({
        kind: 'lsp29_encrypted_asset',
        contentHash: keccak256(toHex(encryptedBody)),
      }),
      createConfig(mocked.fetchImplementation),
    );

    expect(result).toMatchObject({ ok: true, content: encrypted });
  });

  it('follows bounded redirects and validates every redirect target', async () => {
    const cancelled = vi.fn();
    const successful = mockFetch([
      new Response(new ReadableStream({ cancel: cancelled }), {
        status: 302,
        headers: { location: '/current.json' },
      }),
      new Response(body),
    ]);
    await expect(
      fetchMetadata(createSource(), createConfig(successful.fetchImplementation)),
    ).resolves.toMatchObject({ ok: true });
    expect(successful.urls).toEqual([
      'https://metadata.example.test/profile.json',
      'https://metadata.example.test/current.json',
    ]);
    expect(cancelled).toHaveBeenCalledOnce();

    const privateRedirect = mockFetch([
      new Response(null, { status: 307, headers: { location: 'https://127.0.0.1/private' } }),
    ]);
    await expectFetchFailure(
      fetchMetadata(createSource(), createConfig(privateRedirect.fetchImplementation)),
      'non-public',
      false,
    );

    const missingLocation = mockFetch([new Response(null, { status: 302 })]);
    await expectFetchFailure(
      fetchMetadata(createSource(), createConfig(missingLocation.fetchImplementation)),
      'location',
      false,
    );

    const tooMany = mockFetch([
      new Response(null, { status: 302, headers: { location: '/one' } }),
      new Response(null, { status: 302, headers: { location: '/two' } }),
    ]);
    await expectFetchFailure(
      fetchMetadata(createSource(), {
        ...createConfig(tooMany.fetchImplementation),
        maxRedirects: 1,
      }),
      'redirect limit',
    );
  });

  it('rejects hostnames that resolve to non-public addresses', async () => {
    const mocked = mockFetch([new Response(body)]);
    await expectFetchFailure(
      fetchMetadata(createSource(), {
        ...createConfig(mocked.fetchImplementation),
        lookupImplementation: () => Promise.resolve([{ address: '10.0.0.8', family: 4 }]),
      }),
      'resolves to a non-public IP',
      false,
    );
    expect(mocked.urls).toEqual([]);

    await expectFetchFailure(
      fetchMetadata(createSource(), {
        ...createConfig(mocked.fetchImplementation),
        lookupImplementation: () =>
          Promise.resolve([
            { address: '93.184.216.34', family: 4 },
            { address: '127.0.0.1', family: 4 },
          ]),
      }),
      'non-public IP',
      false,
    );
    expect(mocked.urls).toEqual([]);

    await expectFetchFailure(
      fetchMetadata(createSource(), {
        ...createConfig(mocked.fetchImplementation),
        lookupImplementation: () => Promise.resolve([]),
      }),
      'without an IP address',
      true,
    );

    await expectFetchFailure(
      fetchMetadata(createSource(), {
        ...createConfig(mocked.fetchImplementation),
        requestTimeoutMs: 5,
        lookupImplementation: () => new Promise(() => undefined),
      }),
      'timed out',
      true,
    );
  });

  it('classifies HTTP and transport failures for retry policy', async () => {
    for (const [status, retryable] of [
      [404, false],
      [429, true],
      [503, true],
      [599, true],
    ] as const) {
      const mocked = mockFetch([new Response(null, { status })]);
      await expectFetchFailure(
        fetchMetadata(createSource(), createConfig(mocked.fetchImplementation)),
        String(status),
        retryable,
      );
    }

    const networkError = mockFetch([new TypeError('network unavailable')]);
    await expect(
      fetchMetadata(createSource(), createConfig(networkError.fetchImplementation)),
    ).resolves.toMatchObject({ ok: false, retryable: true, error: 'network unavailable' });

    const terminalError = mockFetch([new Error('unexpected failure')]);
    await expect(
      fetchMetadata(createSource(), createConfig(terminalError.fetchImplementation)),
    ).resolves.toMatchObject({ ok: false, retryable: false, error: 'unexpected failure' });

    const mixedGateways = mockFetch([
      new Response(null, { status: 503 }),
      new Response(null, { status: 404 }),
    ]);
    await expectFetchFailure(
      fetchMetadata(createSource({ contentUri: 'ipfs://bafy/profile' }), {
        ...createConfig(mixedGateways.fetchImplementation),
        ipfsGateways: [
          'https://primary-gateway.example.test/ipfs',
          'https://fallback-gateway.example.test/ipfs',
        ],
      }),
      '404',
      true,
    );

    const plainHttp = mockFetch([new Response(body)]);
    await expectFetchFailure(
      fetchMetadata(
        createSource({ contentUri: 'http://metadata.example.test/profile.json' }),
        createConfig(plainHttp.fetchImplementation),
      ),
      'disabled',
      false,
    );
    await expect(
      fetchMetadata(createSource({ contentUri: 'http://metadata.example.test/profile.json' }), {
        ...createConfig(plainHttp.fetchImplementation),
        allowHttp: true,
      }),
    ).resolves.toMatchObject({ ok: true, content });
  });

  it('rejects oversized, absent, invalid UTF-8, and HTML bodies', async () => {
    const advertised = mockFetch([
      new Response('small', { headers: { 'content-length': '2048' } }),
    ]);
    await expectFetchFailure(
      fetchMetadata(createSource(), createConfig(advertised.fetchImplementation)),
      'declares 2048',
    );

    const streamed = mockFetch([new Response('x'.repeat(20))]);
    await expectFetchFailure(
      fetchMetadata(createSource(), {
        ...createConfig(streamed.fetchImplementation),
        maxResponseBytes: 10,
      }),
      '10-byte',
    );

    const absent = mockFetch([new Response(null)]);
    await expectFetchFailure(
      fetchMetadata(createSource(), createConfig(absent.fetchImplementation)),
      'no body',
      true,
    );

    const invalidUtf8 = mockFetch([new Response(new Uint8Array([0xff]))]);
    await expectFetchFailure(
      fetchMetadata(createSource(), createConfig(invalidUtf8.fetchImplementation)),
      'UTF-8',
    );

    const html = mockFetch([new Response(body, { headers: { 'content-type': 'text/html' } })]);
    await expectFetchFailure(
      fetchMetadata(createSource(), createConfig(html.fetchImplementation)),
      'HTML',
    );
  });

  it('rejects invalid JSON schemas, hashes, verification methods, and kinds', async () => {
    for (const [source, response, message] of [
      [createSource({ contentHash: toHex(999n, { size: 32 }) }), new Response(body), 'hash'],
      [createSource({ contentHash: null }), new Response('{'), 'valid JSON'],
      [createSource({ contentHash: null }), new Response('{}'), 'LSP3Profile'],
      [createSource({ kind: 'lsp4_token', contentHash: null }), new Response('{}'), 'LSP4Metadata'],
      [
        createSource({ verificationMethod: '0xffffffff', contentHash: null }),
        new Response(body),
        'verification method',
      ],
      [
        createSource({ kind: 'extension', contentHash: null, verificationMethod: null }),
        new Response(body),
        'Unsupported metadata kind',
      ],
    ] as const) {
      const mocked = mockFetch([response]);
      await expectFetchFailure(
        fetchMetadata(source, createConfig(mocked.fetchImplementation)),
        message,
        false,
      );
    }
  });
});
