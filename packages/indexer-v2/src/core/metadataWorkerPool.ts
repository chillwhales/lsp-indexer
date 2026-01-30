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
import path from 'path';
import { Worker } from 'worker_threads';

import { FETCH_RETRY_COUNT, IPFS_GATEWAY } from '@/constants';

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

  constructor(workerPath: string, workerData: object) {
    this.worker = new Worker(workerPath, { workerData });

    this.worker.on('message', (results: WorkerFetchResult[]) => {
      const job = this.pending;
      this.pending = null;
      this.busy = false;
      if (job) job.resolve(results);
    });

    this.worker.on('error', (error: Error) => {
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
  private isShutdown = false;

  constructor(config: MetadataWorkerPoolConfig = {}) {
    const poolSize = config.poolSize ?? 4;
    const ipfsGateway = config.ipfsGateway ?? IPFS_GATEWAY;
    const requestTimeoutMs = config.requestTimeoutMs ?? 30_000;
    this.maxRetries = config.maxRetries ?? FETCH_RETRY_COUNT;
    this.retryBaseDelayMs = config.retryBaseDelayMs ?? 1_000;

    // Worker script path: compiled JS in lib/core/metadataWorker.js
    const workerPath = path.resolve(__dirname, 'metadataWorker.js');

    const workerData = { ipfsGateway, requestTimeoutMs };

    this.workers = Array.from({ length: poolSize }, () => new PoolWorker(workerPath, workerData));
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

    const finalResults: FetchResult[] = [];
    let pending = requests;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (pending.length === 0) break;

      // Distribute across workers
      const chunks = this.distribute(pending);
      const chunkPromises = chunks.map((chunk, i) => this.workers[i].execute(chunk));
      const workerResults = (await Promise.all(chunkPromises)).flat();

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
          });
        }
      }

      pending = toRetry;

      // Exponential backoff before retry
      if (pending.length > 0 && attempt < this.maxRetries) {
        const delay = this.retryBaseDelayMs * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    return finalResults;
  }

  /**
   * Gracefully shut down all worker threads.
   */
  async shutdown(): Promise<void> {
    if (this.isShutdown) return;
    this.isShutdown = true;
    await Promise.all(this.workers.map((w) => w.terminate()));
  }

  /**
   * Split requests into N chunks (one per worker).
   * Uses round-robin distribution for even load.
   */
  private distribute(requests: FetchRequest[]): FetchRequest[][] {
    const chunks: FetchRequest[][] = this.workers.map(() => []);
    for (let i = 0; i < requests.length; i++) {
      chunks[i % this.workers.length].push(requests[i]);
    }
    // Filter out empty chunks (fewer requests than workers)
    return chunks.filter((c) => c.length > 0);
  }
}
