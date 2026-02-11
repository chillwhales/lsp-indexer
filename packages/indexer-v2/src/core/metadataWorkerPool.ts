/**
 * Metadata worker pool manager.
 *
 * Distributes FetchRequest batches across a pool of worker threads for
 * non-blocking, parallel metadata fetching. Replaces v1's busy-wait
 * polling pattern with proper Promise.all resolution.
 *
 * Usage:
 * ```ts
 * const pool = new MetadataWorkerPool({ poolSize: 4 });
 * const results = await pool.fetchBatch(requests);
 * await pool.shutdown();
 * ```
 */
import { FETCH_RETRY_COUNT, IPFS_GATEWAY } from '@/constants';
import path from 'path';
import type pino from 'pino';
import { Worker } from 'worker_threads';
import { getFileLogger } from './logger';
import { FetchRequest, FetchResult, IMetadataWorkerPool } from './types';

// ---------------------------------------------------------------------------
// Extended FetchResult from workers (includes retryable flag)
// ---------------------------------------------------------------------------

interface WorkerFetchResult extends FetchResult {
  retryable: boolean;
  errorCode?: string;
  errorStatus?: number;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface MetadataWorkerPoolConfig {
  /** Number of worker threads to spawn. Default: 4 */
  poolSize?: number;
  /** IPFS gateway URL. Default: from IPFS_GATEWAY constant */
  ipfsGateway?: string;
  /** Per-request timeout in milliseconds. Default: 30_000 */
  requestTimeoutMs?: number;
  /** Max retries for retryable errors. Default: from FETCH_RETRY_COUNT constant */
  maxRetries?: number;
  /** Base delay for exponential backoff in ms. Default: 1_000 */
  retryBaseDelayMs?: number;
}

// ---------------------------------------------------------------------------
// Worker wrapper — one per thread
// ---------------------------------------------------------------------------

interface PendingJob {
  resolve: (results: WorkerFetchResult[]) => void;
  reject: (error: Error) => void;
}

class PoolWorker {
  readonly worker: Worker;
  busy = false;
  private pending: PendingJob | null = null;

  constructor(workerPath: string, workerData: object, workerId: number) {
    this.worker = new Worker(workerPath, { workerData });

    this.worker.on('message', (results: WorkerFetchResult[]) => {
      const job = this.pending;
      this.pending = null;
      this.busy = false;
      if (job) job.resolve(results);
    });

    this.worker.on('error', (error: Error) => {
      console.error(`[Worker ${workerId}] Error:`, error);
      const job = this.pending;
      this.pending = null;
      this.busy = false;
      if (job) job.reject(error);
    });
  }

  execute(requests: FetchRequest[]): Promise<WorkerFetchResult[]> {
    this.busy = true;
    return new Promise<WorkerFetchResult[]>((resolve, reject) => {
      this.pending = { resolve, reject };
      this.worker.postMessage(requests);
    });
  }

  async terminate(): Promise<void> {
    await this.worker.terminate();
  }
}

// ---------------------------------------------------------------------------
// Pool
// ---------------------------------------------------------------------------

/**
 * Manages a pool of worker threads for parallel metadata fetching.
 *
 * Implements `IMetadataWorkerPool` from core/types.ts.
 *
 * How it works:
 * 1. `fetchBatch(requests)` splits requests evenly across N workers
 * 2. Each worker fetches its chunk in parallel (Promise.all inside the worker)
 * 3. Results are collected, failed retryable requests are retried with
 *    exponential backoff up to `maxRetries` times
 * 4. Final merged results are returned
 */
export class MetadataWorkerPool implements IMetadataWorkerPool {
  private readonly workers: PoolWorker[];
  private readonly maxRetries: number;
  private readonly retryBaseDelayMs: number;
  private readonly logger: pino.Logger | null;
  private isShutdown = false;

  constructor(config: MetadataWorkerPoolConfig = {}) {
    const poolSize = config.poolSize ?? 4;
    const ipfsGateway = config.ipfsGateway ?? IPFS_GATEWAY;
    const requestTimeoutMs = config.requestTimeoutMs ?? 30_000;
    this.maxRetries = config.maxRetries ?? FETCH_RETRY_COUNT;
    this.retryBaseDelayMs = config.retryBaseDelayMs ?? 1_000;

    // Create component logger for worker pool operations
    this.logger = getFileLogger()?.child({ component: 'worker_pool' }) ?? null;

    // Worker script path: compiled JS in lib/core/metadataWorker.js
    // When running with ts-node, __dirname points to src/core, but worker must be in lib/core
    // When running compiled JS, __dirname points to lib/core
    // Detect by checking if current file ends with .ts
    const workerPath = __filename.endsWith('.ts')
      ? path.resolve(__dirname, '../../lib/core/metadataWorker.js') // Running via ts-node
      : path.resolve(__dirname, 'metadataWorker.js'); // Running compiled JS

    const workerData = { ipfsGateway, requestTimeoutMs };

    this.workers = Array.from(
      { length: poolSize },
      (_, i) => new PoolWorker(workerPath, workerData, i),
    );

    // Log pool initialization
    if (this.logger?.isLevelEnabled?.('debug')) {
      this.logger.debug(
        {
          poolSize,
          ipfsGateway,
          requestTimeoutMs,
          maxRetries: this.maxRetries,
          retryBaseDelayMs: this.retryBaseDelayMs,
        },
        'MetadataWorkerPool initialized',
      );
    }
  }

  /**
   * Fetch a batch of metadata URLs using the worker pool.
   *
   * Distributes requests across workers, collects results, and retries
   * failed retryable requests with exponential backoff.
   *
   * @returns One FetchResult per input FetchRequest (order not guaranteed).
   */
  async fetchBatch(requests: FetchRequest[]): Promise<FetchResult[]> {
    if (this.isShutdown) {
      throw new Error('MetadataWorkerPool has been shut down');
    }
    if (requests.length === 0) return [];

    // Log batch start
    if (this.logger?.isLevelEnabled?.('debug')) {
      const availableWorkers = this.workers.filter((w) => !w.busy).length;
      this.logger.debug(
        {
          batchSize: requests.length,
          availableWorkers,
          totalWorkers: this.workers.length,
        },
        'Starting metadata fetch batch',
      );
    }

    const finalResults: FetchResult[] = [];
    let pending = requests;
    const debugEnabled = this.logger?.isLevelEnabled?.('debug') ?? false;
    const startTime = debugEnabled ? Date.now() : 0;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (pending.length === 0) break;

      // Distribute across workers
      const chunks = this.distribute(pending);

      // Log worker assignment
      if (this.logger?.isLevelEnabled?.('debug')) {
        this.logger.debug(
          {
            attempt: attempt + 1,
            maxAttempts: this.maxRetries + 1,
            pendingCount: pending.length,
            workersUsed: chunks.length,
            chunkSizes: chunks.map((c) => c.length),
          },
          'Distributing batch to workers',
        );
      }

      const chunkPromises = chunks.map((chunk, i) => this.workers[i].execute(chunk));
      const workerResults = (await Promise.all(chunkPromises)).flat();

      // Log worker completion
      if (this.logger?.isLevelEnabled?.('debug')) {
        const successCount = workerResults.filter((r) => r.success).length;
        const failureCount = workerResults.filter((r) => !r.success).length;
        this.logger.debug(
          {
            resultsCount: workerResults.length,
            successCount,
            failureCount,
          },
          'Workers completed batch processing',
        );
      }

      // Separate successes and retryable failures
      const toRetry: FetchRequest[] = [];

      for (const result of workerResults) {
        if (result.success) {
          finalResults.push({
            id: result.id,
            entityType: result.entityType,
            success: true,
            data: result.data,
          });
        } else if (result.retryable && attempt < this.maxRetries) {
          // Re-queue for retry
          const original = pending.find((r) => r.id === result.id);
          if (original) {
            toRetry.push(original);
          }
        } else {
          // Non-retryable or exhausted retries — record as failure
          finalResults.push({
            id: result.id,
            entityType: result.entityType,
            success: false,
            error: result.error,
            errorCode: result.errorCode,
            errorStatus: result.errorStatus,
          });
        }
      }

      pending = toRetry;

      // Exponential backoff before retry
      if (pending.length > 0 && attempt < this.maxRetries) {
        const delay = this.retryBaseDelayMs * Math.pow(2, attempt);

        if (this.logger?.isLevelEnabled?.('debug')) {
          this.logger.debug(
            {
              retryCount: pending.length,
              nextAttempt: attempt + 2,
              backoffDelayMs: delay,
            },
            'Retrying failed requests after backoff',
          );
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // Log batch completion
    if (this.logger?.isLevelEnabled?.('debug')) {
      const duration = Date.now() - startTime;
      this.logger.debug(
        {
          totalResults: finalResults.length,
          successCount: finalResults.filter((r) => r.success).length,
          failureCount: finalResults.filter((r) => !r.success).length,
          durationMs: duration,
        },
        'Metadata fetch batch complete',
      );
    }

    return finalResults;
  }

  /**
   * Gracefully shut down all worker threads.
   */
  async shutdown(): Promise<void> {
    if (this.isShutdown) return;

    if (this.logger?.isLevelEnabled?.('debug')) {
      this.logger.debug({ workerCount: this.workers.length }, 'Shutting down MetadataWorkerPool');
    }

    this.isShutdown = true;
    await Promise.all(this.workers.map((w) => w.terminate()));

    if (this.logger?.isLevelEnabled?.('debug')) {
      this.logger.debug({}, 'MetadataWorkerPool shutdown complete');
    }
  }

  /**
   * Split requests into N chunks (one per worker).
   * Uses round-robin distribution for even load.
   */
  private distribute(requests: FetchRequest[]): FetchRequest[][] {
    const chunks: FetchRequest[][] = this.workers.map((): FetchRequest[] => []);
    for (let i = 0; i < requests.length; i++) {
      chunks[i % this.workers.length].push(requests[i]);
    }
    // Filter out empty chunks (fewer requests than workers)
    return chunks.filter((c) => c.length > 0);
  }
}
