import { z } from 'zod';
import type { RuntimeConfig } from '../config/index.js';
import { resolveMetadataRequestUrl } from './fetch.js';

const UrlSchema = z.url();

export interface MetadataWorkerConfig {
  concurrency: number;
  pollIntervalMs: number;
  requestTimeoutMs: number;
  maxResponseBytes: number;
  maxRedirects: number;
  maxAttempts: number;
  retryBaseMs: number;
  retryMaximumMs: number;
  leaseTimeoutMs: number;
  metricsPort: number;
  ipfsGateways: readonly string[];
  allowHttp: boolean;
  runOnce: boolean;
}

function readInteger(
  value: string | undefined,
  name: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  if (value == null || value.trim() === '') return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(`${name} must be a safe integer between ${minimum} and ${maximum}`);
  }
  return parsed;
}

function readBoolean(value: string | undefined, name: string, fallback: boolean): boolean {
  if (value == null || value.trim() === '') return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1') return true;
  if (normalized === 'false' || normalized === '0') return false;
  throw new Error(`${name} must be one of: true, false, 1, 0`);
}

function readGateways(value: string | undefined, fallback: string, allowHttp: boolean): string[] {
  const candidates = (value?.trim() || fallback)
    .split(',')
    .map((candidate) => candidate.trim())
    .filter((candidate) => candidate.length > 0);
  if (candidates.length === 0 || candidates.length > 5) {
    throw new Error('METADATA_IPFS_GATEWAYS must contain between one and five URLs');
  }
  const gateways = new Set<string>();
  for (const candidate of candidates) {
    const parsed = UrlSchema.safeParse(candidate);
    if (!parsed.success) {
      throw new Error('METADATA_IPFS_GATEWAYS must contain absolute HTTP(S) URLs');
    }
    const url = new URL(parsed.data);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('METADATA_IPFS_GATEWAYS must use HTTP or HTTPS');
    }
    if (url.username !== '' || url.password !== '' || url.search !== '' || url.hash !== '') {
      throw new Error('METADATA_IPFS_GATEWAYS must not contain credentials, queries, or fragments');
    }
    if (url.protocol === 'http:' && !allowHttp) {
      throw new Error('HTTP IPFS gateways require METADATA_ALLOW_HTTP=true');
    }
    try {
      resolveMetadataRequestUrl('ipfs://configuration-check', url.toString(), allowHttp);
    } catch (error) {
      throw new Error(
        `METADATA_IPFS_GATEWAYS contains an unsafe URL: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    gateways.add(url.toString().replace(/\/+$/, ''));
  }
  return [...gateways];
}

/** Load the independent metadata worker's bounded retry and transport policy. */
export function loadMetadataWorkerConfig(
  runtime: RuntimeConfig,
  env: NodeJS.ProcessEnv = process.env,
): MetadataWorkerConfig {
  const requestTimeoutMs = readInteger(
    env.METADATA_REQUEST_TIMEOUT_MS,
    'METADATA_REQUEST_TIMEOUT_MS',
    15_000,
    100,
    300_000,
  );
  const retryBaseMs = readInteger(
    env.METADATA_RETRY_BASE_MS,
    'METADATA_RETRY_BASE_MS',
    5_000,
    100,
    3_600_000,
  );
  const retryMaximumMs = readInteger(
    env.METADATA_RETRY_MAX_MS,
    'METADATA_RETRY_MAX_MS',
    1_800_000,
    100,
    86_400_000,
  );
  const leaseTimeoutMs = readInteger(
    env.METADATA_LEASE_TIMEOUT_MS,
    'METADATA_LEASE_TIMEOUT_MS',
    300_000,
    1_000,
    3_600_000,
  );
  if (retryMaximumMs < retryBaseMs) {
    throw new Error(
      'METADATA_RETRY_MAX_MS must be greater than or equal to METADATA_RETRY_BASE_MS',
    );
  }
  const allowHttp = readBoolean(env.METADATA_ALLOW_HTTP, 'METADATA_ALLOW_HTTP', false);
  const ipfsGateways = readGateways(
    env.METADATA_IPFS_GATEWAYS,
    runtime.network.ipfsGateway,
    allowHttp,
  );
  if (leaseTimeoutMs <= requestTimeoutMs * ipfsGateways.length) {
    throw new Error(
      'METADATA_LEASE_TIMEOUT_MS must exceed METADATA_REQUEST_TIMEOUT_MS multiplied by the gateway count',
    );
  }

  return {
    concurrency: readInteger(env.METADATA_CONCURRENCY, 'METADATA_CONCURRENCY', 8, 1, 64),
    pollIntervalMs: readInteger(
      env.METADATA_POLL_INTERVAL_MS,
      'METADATA_POLL_INTERVAL_MS',
      1_000,
      50,
      60_000,
    ),
    requestTimeoutMs,
    maxResponseBytes: readInteger(
      env.METADATA_MAX_RESPONSE_BYTES,
      'METADATA_MAX_RESPONSE_BYTES',
      2_097_152,
      1_024,
      16_777_216,
    ),
    maxRedirects: readInteger(env.METADATA_MAX_REDIRECTS, 'METADATA_MAX_REDIRECTS', 3, 0, 10),
    maxAttempts: readInteger(env.METADATA_MAX_ATTEMPTS, 'METADATA_MAX_ATTEMPTS', 6, 1, 100),
    retryBaseMs,
    retryMaximumMs,
    leaseTimeoutMs,
    metricsPort: readInteger(env.METADATA_METRICS_PORT, 'METADATA_METRICS_PORT', 9_091, 1, 65_535),
    ipfsGateways,
    allowHttp,
    runOnce: readBoolean(env.METADATA_RUN_ONCE, 'METADATA_RUN_ONCE', false),
  };
}
