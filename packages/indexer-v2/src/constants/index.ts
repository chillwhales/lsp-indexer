import { isNumeric } from '@/utils';
import { config as dotenvSetup } from 'dotenv';
import path from 'path';

// Load .env from monorepo root
// This ensures env vars are loaded whether running from root or package directory
dotenvSetup({ path: path.resolve(__dirname, '../../../../.env') });

export const SQD_GATEWAY =
  process.env.SQD_GATEWAY || 'https://v2.archive.subsquid.io/network/lukso-mainnet';
export const RPC_URL = process.env.RPC_URL || 'https://rpc.lukso.sigmacore.io';
export const RPC_RATE_LIMIT = isNumeric(process.env.RPC_RATE_LIMIT)
  ? parseInt(process.env.RPC_RATE_LIMIT)
  : 10;
export const FINALITY_CONFIRMATION = isNumeric(process.env.FINALITY_CONFIRMATION)
  ? parseInt(process.env.FINALITY_CONFIRMATION)
  : 75;

export const IPFS_GATEWAY = process.env.IPFS_GATEWAY || 'https://api.universalprofile.cloud/ipfs/';

/**
 * Maximum number of unfetched entities to query from DB per handler when isHead=true.
 * These entities are then split into batches of FETCH_BATCH_SIZE for sequential processing
 * to limit memory usage. At 10,000 limit with 1,000 batch size, processes ~30,000 entities/minute
 * across 3 handlers (LSP3, LSP4, LSP29).
 */
export const FETCH_LIMIT = isNumeric(process.env.FETCH_LIMIT)
  ? parseInt(process.env.FETCH_LIMIT)
  : 10_000;

/**
 * Number of entities to process in each worker pool batch.
 * Balances memory usage vs throughput. Too large causes OOM, too small is inefficient.
 * V1 uses 1,000 successfully in production, but V2 worker pool appears to hang with
 * large batches. Reduced to 100 to prevent worker pool deadlock/OOM.
 */
export const FETCH_BATCH_SIZE = isNumeric(process.env.FETCH_BATCH_SIZE)
  ? parseInt(process.env.FETCH_BATCH_SIZE)
  : 100;

export const FETCH_RETRY_COUNT = isNumeric(process.env.FETCH_RETRY_COUNT)
  ? parseInt(process.env.FETCH_RETRY_COUNT)
  : 5;

/**
 * Timeout in milliseconds for each worker pool batch fetch.
 * If a batch takes longer than this, log a warning (but don't cancel - let it complete).
 * Default: 5 minutes (300,000ms) - enough for 1,000 IPFS fetches with retries.
 */
export const FETCH_BATCH_TIMEOUT_MS = isNumeric(process.env.FETCH_BATCH_TIMEOUT_MS)
  ? parseInt(process.env.FETCH_BATCH_TIMEOUT_MS)
  : 300_000;

export const MULTICALL_ADDRESS = '0x144f4290051C2Ad2aCc9D7b6E8cC0dBe36644869';

export const LSP26_ADDRESS = '0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA';
export const LSP23_ADDRESS = '0x2300000A84D25dF63081feAa37ba6b62C4c89a30';

// Special addresses that cannot be Universal Profiles or Digital Assets
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
export const DEAD_ADDRESS = '0x000000000000000000000000000000000000dEaD';

// LSP29 Data Keys
export * from './lsp29';
