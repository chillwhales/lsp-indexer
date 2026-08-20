import { describe, expect, it } from 'vitest';
import { loadRuntimeConfig } from '../runtime.js';

function createEnv(overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    INDEXER_NETWORK: 'ethereum-mainnet',
    ...overrides,
  };
}

const INVALID_ENVIRONMENTS: Array<[NodeJS.ProcessEnv, string]> = [
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
