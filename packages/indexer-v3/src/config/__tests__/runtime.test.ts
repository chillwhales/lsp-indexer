import { describe, expect, it } from 'vitest';
import { loadRuntimeConfig } from '../runtime.js';

function createEnv(overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    INDEXER_NETWORK: 'ethereum-mainnet',
    ...overrides,
  };
}

const INVALID_ENVIRONMENTS: [NodeJS.ProcessEnv, string][] = [
  [{}, 'INDEXER_NETWORK is required'],
  [createEnv({ INDEXER_FROM_BLOCK: '-1' }), 'INDEXER_FROM_BLOCK must be a safe integer'],
  [createEnv({ INDEXER_TO_BLOCK: '1.5' }), 'INDEXER_TO_BLOCK must be a safe integer'],
  [
    createEnv({ INDEXER_FROM_BLOCK: '10', INDEXER_TO_BLOCK: '9' }),
    'INDEXER_TO_BLOCK must be greater than or equal',
  ],
  [createEnv({ INDEXER_METRICS_PORT: '0' }), 'INDEXER_METRICS_PORT must be a safe integer'],
  [createEnv({ INDEXER_METRICS_PORT: '65536' }), 'INDEXER_METRICS_PORT must be a safe integer'],
  [createEnv({ INDEXER_ALLOW_HISTORICAL_SOURCE: 'yes' }), 'must be one of'],
  [createEnv({ INDEXER_SOURCE_MODE: 'archive' }), 'INDEXER_SOURCE_MODE must be one of'],
  [createEnv({ INDEXER_RPC_RATE_LIMIT: '0' }), 'INDEXER_RPC_RATE_LIMIT must be a safe integer'],
  [
    createEnv({ INDEXER_SOURCE_STALL_TIMEOUT_MS: '999' }),
    'INDEXER_SOURCE_STALL_TIMEOUT_MS must be a safe integer',
  ],
  [createEnv({ RPC_URL: 'file:///tmp/rpc' }), 'RPC_URL must use HTTP or HTTPS'],
  [createEnv({ SQD_PORTAL_URL: 'not-a-url' }), 'SQD_PORTAL_URL must be an absolute'],
];

describe('runtime configuration', () => {
  it('derives network-scoped defaults', () => {
    const runtime = loadRuntimeConfig(createEnv());

    expect(runtime.network.key).toBe('ethereum-mainnet');
    expect(runtime.streamId).toBe('lsp-indexer:v3:eip155:1');
    expect(runtime.databaseSchema).toBe('chain_ethereum_mainnet');
    expect(runtime.portalUrl).toBe('https://portal.sqd.dev/datasets/ethereum-mainnet');
    expect(runtime.rpcUrl).toBe('https://ethereum-rpc.publicnode.com');
    expect(runtime.sourceMode).toBe('portal');
    expect(runtime.sourceFallback).toEqual({
      rpcRateLimit: 10,
      sourceRetries: 2,
      maxStalenessMs: 30_000,
      maxLagBlocks: 10,
      allDownTimeoutMs: 300_000,
    });
    expect(runtime.range).toEqual({ from: 0 });
    expect(runtime.allowHistoricalSource).toBe(false);
    expect(runtime.metricsPort).toBe(9090);
  });

  it('validates and normalizes runtime overrides', () => {
    const runtime = loadRuntimeConfig(
      createEnv({
        INDEXER_FROM_BLOCK: '100',
        INDEXER_TO_BLOCK: '200',
        INDEXER_ALLOW_HISTORICAL_SOURCE: ' TRUE ',
        INDEXER_METRICS_PORT: '9191',
        INDEXER_SOURCE_MODE: 'fallback',
        INDEXER_RPC_RATE_LIMIT: '25',
        INDEXER_SOURCE_RETRIES: '4',
        INDEXER_SOURCE_STALL_TIMEOUT_MS: '45000',
        INDEXER_SOURCE_MAX_LAG_BLOCKS: '20',
        INDEXER_SOURCE_ALL_DOWN_TIMEOUT_MS: '600000',
        SQD_PORTAL_URL: 'https://portal.example.test/custom///',
        RPC_URL: 'https://generic-rpc.example.test/',
        RPC_URL_ETHEREUM_MAINNET: 'https://mainnet-rpc.example.test/',
      }),
    );

    expect(runtime.range).toEqual({ from: 100, to: 200 });
    expect(runtime.allowHistoricalSource).toBe(true);
    expect(runtime.metricsPort).toBe(9191);
    expect(runtime.portalUrl).toBe('https://portal.example.test/custom');
    expect(runtime.rpcUrl).toBe('https://mainnet-rpc.example.test');
    expect(runtime.sourceMode).toBe('fallback');
    expect(runtime.sourceFallback).toEqual({
      rpcRateLimit: 25,
      sourceRetries: 4,
      maxStalenessMs: 45_000,
      maxLagBlocks: 20,
      allDownTimeoutMs: 600_000,
    });
  });

  it('defaults historical LUKSO to the official Portal-to-RPC fallback path', () => {
    expect(loadRuntimeConfig({ INDEXER_NETWORK: 'lukso-mainnet' }).sourceMode).toBe('fallback');
  });

  it('uses the process-wide RPC override when no network override exists', () => {
    expect(loadRuntimeConfig(createEnv({ RPC_URL: 'https://rpc.example.test' })).rpcUrl).toBe(
      'https://rpc.example.test',
    );
  });

  it.each(INVALID_ENVIRONMENTS)('rejects invalid environment input', (env, message) => {
    expect(() => loadRuntimeConfig(env)).toThrow(message);
  });
});
