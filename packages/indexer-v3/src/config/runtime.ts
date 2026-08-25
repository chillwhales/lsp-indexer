import { z } from 'zod';
import {
  createNetworkSchema,
  createStreamId,
  getNetworkConfig,
  type NetworkConfig,
} from './networks.js';

const UrlSchema = z.url();

export interface BlockRange {
  from: number;
  to?: number;
}

export type SourceMode = 'portal' | 'rpc' | 'fallback';

export interface SourceFallbackConfig {
  rpcRateLimit: number;
  sourceRetries: number;
  maxStalenessMs: number;
  maxLagBlocks: number;
  allDownTimeoutMs: number;
}

export interface RuntimeConfig {
  network: NetworkConfig;
  streamId: string;
  databaseSchema: string;
  portalUrl: string;
  rpcUrl: string;
  sourceMode: SourceMode;
  sourceFallback: SourceFallbackConfig;
  range: BlockRange;
  allowHistoricalSource: boolean;
  metricsPort: number;
}

function readRequiredNetwork(env: NodeJS.ProcessEnv): string {
  const value = env.INDEXER_NETWORK?.trim();
  if (!value) {
    throw new Error('INDEXER_NETWORK is required');
  }
  return value;
}

function readOptionalUrl(value: string | undefined, name: string): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  const result = UrlSchema.safeParse(trimmed);
  if (!result.success) {
    throw new Error(`${name} must be an absolute HTTP or HTTPS URL`);
  }
  const protocol = new URL(result.data).protocol;
  if (protocol !== 'http:' && protocol !== 'https:') {
    throw new Error(`${name} must use HTTP or HTTPS`);
  }
  return result.data.replace(/\/+$/, '');
}

function readInteger(
  value: string | undefined,
  name: string,
  fallback: number,
  minimum: number,
  maximum = Number.MAX_SAFE_INTEGER,
): number {
  if (value == null || value.trim() === '') return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(`${name} must be a safe integer between ${minimum} and ${maximum}`);
  }
  return parsed;
}

function readOptionalInteger(
  value: string | undefined,
  name: string,
  minimum: number,
): number | undefined {
  if (value == null || value.trim() === '') return undefined;
  return readInteger(value, name, minimum, minimum);
}

function readBoolean(value: string | undefined, name: string, fallback: boolean): boolean {
  if (value == null || value.trim() === '') return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1') return true;
  if (normalized === 'false' || normalized === '0') return false;
  throw new Error(`${name} must be one of: true, false, 1, 0`);
}

function readSourceMode(value: string | undefined, fallback: SourceMode): SourceMode {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return fallback;
  if (normalized === 'portal' || normalized === 'rpc' || normalized === 'fallback') {
    return normalized;
  }
  throw new Error('INDEXER_SOURCE_MODE must be one of: portal, rpc, fallback');
}

function resolveRpcUrl(env: NodeJS.ProcessEnv, network: NetworkConfig): string {
  const networkOverride = readOptionalUrl(
    env[network.rpc.environmentVariable],
    network.rpc.environmentVariable,
  );
  const processOverride = readOptionalUrl(env.RPC_URL, 'RPC_URL');
  return networkOverride ?? processOverride ?? network.rpc.defaultUrl;
}

/** Load and validate runtime configuration for exactly one network process. */
export function loadRuntimeConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const network = getNetworkConfig(readRequiredNetwork(env));
  const from = readInteger(env.INDEXER_FROM_BLOCK, 'INDEXER_FROM_BLOCK', network.startBlock, 0);
  const to = readOptionalInteger(env.INDEXER_TO_BLOCK, 'INDEXER_TO_BLOCK', 0);

  if (to != null && to < from) {
    throw new Error('INDEXER_TO_BLOCK must be greater than or equal to INDEXER_FROM_BLOCK');
  }

  const range: BlockRange = to == null ? { from } : { from, to };
  const sourceMode = readSourceMode(
    env.INDEXER_SOURCE_MODE,
    network.portal.expectedRealtime ? 'portal' : 'fallback',
  );

  return {
    network,
    streamId: createStreamId(network.chainId),
    databaseSchema: createNetworkSchema(network.key),
    portalUrl: readOptionalUrl(env.SQD_PORTAL_URL, 'SQD_PORTAL_URL') ?? network.portal.url,
    rpcUrl: resolveRpcUrl(env, network),
    sourceMode,
    sourceFallback: {
      rpcRateLimit: readInteger(
        env.INDEXER_RPC_RATE_LIMIT,
        'INDEXER_RPC_RATE_LIMIT',
        network.rpc.rateLimit,
        1,
        100_000,
      ),
      sourceRetries: readInteger(env.INDEXER_SOURCE_RETRIES, 'INDEXER_SOURCE_RETRIES', 2, 0, 100),
      maxStalenessMs: readInteger(
        env.INDEXER_SOURCE_STALL_TIMEOUT_MS,
        'INDEXER_SOURCE_STALL_TIMEOUT_MS',
        30_000,
        1_000,
        3_600_000,
      ),
      maxLagBlocks: readInteger(
        env.INDEXER_SOURCE_MAX_LAG_BLOCKS,
        'INDEXER_SOURCE_MAX_LAG_BLOCKS',
        10,
        1,
        1_000_000,
      ),
      allDownTimeoutMs: readInteger(
        env.INDEXER_SOURCE_ALL_DOWN_TIMEOUT_MS,
        'INDEXER_SOURCE_ALL_DOWN_TIMEOUT_MS',
        300_000,
        1_000,
        86_400_000,
      ),
    },
    range,
    allowHistoricalSource: readBoolean(
      env.INDEXER_ALLOW_HISTORICAL_SOURCE,
      'INDEXER_ALLOW_HISTORICAL_SOURCE',
      false,
    ),
    metricsPort: readInteger(env.INDEXER_METRICS_PORT, 'INDEXER_METRICS_PORT', 9090, 1, 65_535),
  };
}
