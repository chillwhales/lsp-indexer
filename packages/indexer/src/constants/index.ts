import { isNumeric } from '@chillwhales/utils';
import { config as dotenvSetup } from 'dotenv';
import path from 'path';

// Load .env from monorepo root
// This ensures env vars are loaded whether running from root or package directory
dotenvSetup({ path: path.resolve(__dirname, '../../../../.env') });

// ---------------------------------------------------------------------------
// Chain-agnostic constants only — all chain-specific values live in
// config/chainConfig.ts and are accessed via ChainConfig.
// ---------------------------------------------------------------------------

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
 * Worker pool appears to hang with large batches. Reduced to 100 to prevent
 * worker pool deadlock/OOM.
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

/**
 * Number of requests each worker processes per batch in queue-based pool.
 * With 4 workers and 250 batch size, workers continuously pull 250 requests
 * from queue, keeping all workers busy without idle time between batches.
 */
export const WORKER_BATCH_SIZE = isNumeric(process.env.WORKER_BATCH_SIZE)
  ? parseInt(process.env.WORKER_BATCH_SIZE)
  : 250;

/**
 * Maximum length for JSON-stringified metadata fields (condition, encryptedKey, etc.).
 * Prevents storage of excessively large objects from malicious metadata.
 */
export const MAX_JSON_LENGTH = isNumeric(process.env.MAX_JSON_LENGTH)
  ? parseInt(process.env.MAX_JSON_LENGTH)
  : 65_536;

/**
 * Maximum number of elements in chunk/address array columns.
 * Prevents storage exhaustion from malicious metadata with oversized arrays.
 */
export const MAX_CHUNK_ARRAY_LENGTH = isNumeric(process.env.MAX_CHUNK_ARRAY_LENGTH)
  ? parseInt(process.env.MAX_CHUNK_ARRAY_LENGTH)
  : 10_000;

// Special addresses that cannot be Universal Profiles or Digital Assets
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
export const DEAD_ADDRESS = '0x000000000000000000000000000000000000dEaD';
