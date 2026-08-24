import { describe, expect, it } from 'vitest';
import { loadRuntimeConfig } from '../../config/index.js';
import { loadMetadataWorkerConfig } from '../config.js';

const runtime = loadRuntimeConfig({ INDEXER_NETWORK: 'ethereum-mainnet' });

const INVALID_ENVIRONMENTS: [NodeJS.ProcessEnv, string][] = [
  [{ METADATA_CONCURRENCY: '0' }, 'METADATA_CONCURRENCY must be a safe integer'],
  [{ METADATA_POLL_INTERVAL_MS: '49' }, 'METADATA_POLL_INTERVAL_MS must be a safe integer'],
  [{ METADATA_REQUEST_TIMEOUT_MS: '99' }, 'METADATA_REQUEST_TIMEOUT_MS must be a safe integer'],
  [{ METADATA_MAX_RESPONSE_BYTES: '1023' }, 'METADATA_MAX_RESPONSE_BYTES must be a safe integer'],
  [{ METADATA_MAX_REDIRECTS: '11' }, 'METADATA_MAX_REDIRECTS must be a safe integer'],
  [{ METADATA_MAX_ATTEMPTS: '1.5' }, 'METADATA_MAX_ATTEMPTS must be a safe integer'],
  [
    { METADATA_RETRY_BASE_MS: '200', METADATA_RETRY_MAX_MS: '100' },
    'METADATA_RETRY_MAX_MS must be greater than or equal',
  ],
  [
    { METADATA_REQUEST_TIMEOUT_MS: '1000', METADATA_LEASE_TIMEOUT_MS: '1000' },
    'METADATA_LEASE_TIMEOUT_MS must exceed',
  ],
  [{ METADATA_METRICS_PORT: '65536' }, 'METADATA_METRICS_PORT must be a safe integer'],
  [{ METADATA_IPFS_GATEWAYS: 'ipfs://gateway' }, 'must use HTTP or HTTPS'],
  [{ METADATA_IPFS_GATEWAYS: 'not a url' }, 'must contain absolute HTTP(S) URLs'],
  [{ METADATA_IPFS_GATEWAYS: 'http://gateway.test' }, 'require METADATA_ALLOW_HTTP=true'],
  [
    { METADATA_IPFS_GATEWAYS: 'https://user:password@gateway.test/ipfs' },
    'must not contain credentials',
  ],
  [
    { METADATA_IPFS_GATEWAYS: 'https://gateway.test/ipfs?format=json' },
    'must not contain credentials',
  ],
  [
    { METADATA_IPFS_GATEWAYS: 'https://gateway.test/ipfs#fragment' },
    'must not contain credentials',
  ],
  [{ METADATA_IPFS_GATEWAYS: 'https://127.0.0.1/ipfs' }, 'contains an unsafe URL'],
  [{ METADATA_IPFS_GATEWAYS: 'https://gateway.local/ipfs' }, 'contains an unsafe URL'],
  [{ METADATA_ALLOW_HTTP: 'yes' }, 'METADATA_ALLOW_HTTP must be one of'],
  [{ METADATA_RUN_ONCE: 'yes' }, 'METADATA_RUN_ONCE must be one of'],
];

describe('metadata worker configuration', () => {
  it('derives bounded defaults from the selected network', () => {
    expect(loadMetadataWorkerConfig(runtime, {})).toEqual({
      concurrency: 8,
      pollIntervalMs: 1_000,
      requestTimeoutMs: 15_000,
      maxResponseBytes: 2_097_152,
      maxRedirects: 3,
      maxAttempts: 6,
      retryBaseMs: 5_000,
      retryMaximumMs: 1_800_000,
      leaseTimeoutMs: 300_000,
      metricsPort: 9_091,
      ipfsGateways: ['https://ipfs.io/ipfs'],
      allowHttp: false,
      runOnce: false,
    });
  });

  it('validates and normalizes every override', () => {
    expect(
      loadMetadataWorkerConfig(runtime, {
        METADATA_CONCURRENCY: '4',
        METADATA_POLL_INTERVAL_MS: '250',
        METADATA_REQUEST_TIMEOUT_MS: '500',
        METADATA_MAX_RESPONSE_BYTES: '4096',
        METADATA_MAX_REDIRECTS: '0',
        METADATA_MAX_ATTEMPTS: '2',
        METADATA_RETRY_BASE_MS: '300',
        METADATA_RETRY_MAX_MS: '600',
        METADATA_LEASE_TIMEOUT_MS: '2000',
        METADATA_METRICS_PORT: '9191',
        METADATA_IPFS_GATEWAYS:
          'https://gateway.example.test/ipfs///, http://fallback.example.test/ipfs/',
        METADATA_ALLOW_HTTP: '1',
        METADATA_RUN_ONCE: ' TRUE ',
      }),
    ).toEqual({
      concurrency: 4,
      pollIntervalMs: 250,
      requestTimeoutMs: 500,
      maxResponseBytes: 4096,
      maxRedirects: 0,
      maxAttempts: 2,
      retryBaseMs: 300,
      retryMaximumMs: 600,
      leaseTimeoutMs: 2000,
      metricsPort: 9191,
      ipfsGateways: ['https://gateway.example.test/ipfs', 'http://fallback.example.test/ipfs'],
      allowHttp: true,
      runOnce: true,
    });
  });

  it.each(INVALID_ENVIRONMENTS)('rejects invalid environment input', (env, message) => {
    expect(() => loadMetadataWorkerConfig(runtime, env)).toThrow(message);
  });
});
