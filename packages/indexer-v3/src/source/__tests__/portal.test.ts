import { describe, expect, it, vi } from 'vitest';
import { loadRuntimeConfig, type RuntimeConfig } from '../../config/index.js';
import { assertPortalReadiness, fetchPortalMetadata, type PortalMetadata } from '../portal.js';

function createRuntime(overrides: NodeJS.ProcessEnv = {}): RuntimeConfig {
  return loadRuntimeConfig({
    INDEXER_NETWORK: 'lukso-mainnet',
    ...overrides,
  });
}

function createMetadata(overrides: Partial<PortalMetadata> = {}): PortalMetadata {
  return {
    dataset: 'lukso-mainnet',
    aliases: [],
    realTime: false,
    startBlock: 0,
    ...overrides,
  };
}

function createJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Portal metadata', () => {
  it('fetches and maps Portal metadata', async () => {
    const fetchImplementation = vi.fn(
      (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
        expect(input).toBe('https://portal.example.test/dataset/metadata');
        expect(init?.headers).toEqual({ Accept: 'application/json' });
        expect(init?.signal).toBeInstanceOf(AbortSignal);
        return Promise.resolve(
          createJsonResponse({
            dataset: 'canonical-lukso',
            aliases: ['lukso-mainnet'],
            real_time: true,
            start_block: 10,
          }),
        );
      },
    );

    await expect(
      fetchPortalMetadata('https://portal.example.test/dataset/', fetchImplementation),
    ).resolves.toEqual({
      dataset: 'canonical-lukso',
      aliases: ['lukso-mainnet'],
      realTime: true,
      startBlock: 10,
    });
    expect(fetchImplementation).toHaveBeenCalledOnce();
  });

  it('reports HTTP and schema failures', async () => {
    const failedFetch = vi.fn(
      (): Promise<Response> => Promise.resolve(createJsonResponse({}, 503)),
    );
    const invalidFetch = vi.fn(
      (): Promise<Response> =>
        Promise.resolve(createJsonResponse({ dataset: '', real_time: 'yes', start_block: -1 })),
    );

    await expect(fetchPortalMetadata('https://portal.test', failedFetch)).rejects.toThrow(
      'HTTP 503',
    );
    await expect(fetchPortalMetadata('https://portal.test', invalidFetch)).rejects.toThrow(
      'metadata response is invalid',
    );
  });
});

describe('Portal readiness', () => {
  it('accepts an alias and a bounded historical backfill', () => {
    const runtime = createRuntime({ INDEXER_FROM_BLOCK: '10', INDEXER_TO_BLOCK: '20' });

    expect(
      assertPortalReadiness(
        runtime,
        createMetadata({ dataset: 'canonical-lukso', aliases: ['lukso-mainnet'] }),
      ),
    ).toEqual({ dataset: 'canonical-lukso', realTime: false, bounded: true });
  });

  it('accepts an explicitly approved unbounded historical source', () => {
    const runtime = createRuntime({
      INDEXER_SOURCE_MODE: 'portal',
      INDEXER_ALLOW_HISTORICAL_SOURCE: 'true',
    });

    expect(assertPortalReadiness(runtime, createMetadata()).bounded).toBe(false);
  });

  it('accepts an unbounded real-time source without an override', () => {
    const runtime = createRuntime();

    expect(assertPortalReadiness(runtime, createMetadata({ realTime: true })).realTime).toBe(true);
  });

  it('rejects mismatched, incomplete, and unsafe historical datasets', () => {
    const runtime = createRuntime({ INDEXER_FROM_BLOCK: '10', INDEXER_SOURCE_MODE: 'portal' });

    expect(() =>
      assertPortalReadiness(runtime, createMetadata({ dataset: 'ethereum-mainnet' })),
    ).toThrow('Portal dataset mismatch');
    expect(() => assertPortalReadiness(runtime, createMetadata({ startBlock: 11 }))).toThrow(
      'starts at block 11',
    );
    expect(() => assertPortalReadiness(runtime, createMetadata())).toThrow('is not real-time');
  });

  it('accepts a historical Portal when a live RPC fallback is configured', () => {
    const runtime = createRuntime({ INDEXER_SOURCE_MODE: 'fallback' });

    expect(assertPortalReadiness(runtime, createMetadata())).toEqual({
      dataset: 'lukso-mainnet',
      realTime: false,
      bounded: false,
    });
  });
});
