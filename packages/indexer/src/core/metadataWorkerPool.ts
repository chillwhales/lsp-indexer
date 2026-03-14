/**
 * Metadata worker pool manager — Queue-based architecture.
 *
 * Workers continuously pull work from a shared queue, eliminating idle time
 * between batches. Failed requests re-enter the queue after individual backoff
 * delays. Multiple concurrent fetchBatch() calls merge into the shared queue.
 *
 * Usage:
 * ```ts
 * const pool = new MetadataWorkerPool({ poolSize: 4 });
 * const results = await pool.fetchBatch(requests);
 * await pool.shutdown();
 * ```
 */
import { FETCH_RETRY_COUNT, IPFS_GATEWAY, WORKER_BATCH_SIZE } from '@/constants';
import crypto from 'crypto';
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

/** Duplicated from metadataWorker.ts — worker threads can't import from src */
interface WorkerLogMessage {
  type: 'LOG';
  level: 'error' | 'warn' | 'info' | 'debug';
  attrs: Record<string, unknown>;
  message: string;
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
  /** Number of requests each worker processes per batch. Default: from WORKER_BATCH_SIZE constant */
  workerBatchSize?: number;
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
  private readonly workerPath: string;
  private readonly workerData: object;
  private readonly workerId: number;
  private restartCount = 0;
  private readonly maxRestarts = 3;
  private readonly pool: MetadataWorkerPool;
  currentBatch: FetchRequest[] = []; // Track in-flight requests for this worker
  isDead = false; // Mark permanently dead after max restarts

  constructor(workerPath: string, workerData: object, workerId: number, pool: MetadataWorkerPool) {
    this.workerPath = workerPath;
    this.workerData = workerData;
    this.workerId = workerId;
    this.pool = pool;
    this.worker = this.createWorker();
  }

  private createWorker(): Worker {
    const worker = new Worker(this.workerPath, { workerData: this.workerData });

    worker.on('message', (message: WorkerFetchResult[] | WorkerLogMessage) => {
      // Handle worker log relay
      if (
        message &&
        typeof message === 'object' &&
        !Array.isArray(message) &&
        'type' in message &&
        message.type === 'LOG'
      ) {
        this.handleLogMessage(message);
        return;
      }
      // Existing result handling
      const results = message as WorkerFetchResult[];
      const job = this.pending;
      this.pending = null;
      this.busy = false;
      this.currentBatch = [];
      if (job) job.resolve(results);
    });

    worker.on('error', (error: Error) => {
      if (this.pool.logger?.isLevelEnabled?.('error')) {
        this.pool.logger.error({ workerId: this.workerId, error: error.message }, 'Worker error');
      }
      const job = this.pending;
      this.pending = null;
      this.busy = false;
      // Don't clear currentBatch here - needed for re-queue
      if (job) job.reject(error);
    });

    worker.on('exit', (code) => {
      if (code !== 0 && !this.isDead) {
        this.handleCrash();
      }
    });

    return worker;
  }

  private handleCrash(): void {
    this.restartCount++;

    if (this.pool.logger?.isLevelEnabled?.('warn')) {
      this.pool.logger.warn(
        {
          workerId: this.workerId,
          restartCount: this.restartCount,
          maxRestarts: this.maxRestarts,
          inFlightRequests: this.currentBatch.length,
        },
        'Worker crashed, handling recovery',
      );
    }

    // Re-queue in-flight requests (no retry count increment - worker died, not request failure)
    if (this.currentBatch.length > 0) {
      this.pool.handleWorkerCrash(this.currentBatch);
      this.currentBatch = [];
    }

    // Clear busy and pending state before respawn or marking dead
    this.busy = false;
    this.pending = null;

    if (this.restartCount <= this.maxRestarts) {
      // Respawn worker
      this.respawnWorker();
    } else {
      // Max restarts exceeded - mark as permanently dead
      this.isDead = true;
      if (this.pool.logger?.isLevelEnabled?.('error')) {
        this.pool.logger.error(
          {
            workerId: this.workerId,
            restartCount: this.restartCount,
          },
          'Worker exceeded max restarts, marked as dead',
        );
      }
    }
  }

  private respawnWorker(): void {
    if (this.pool.logger?.isLevelEnabled?.('info')) {
      this.pool.logger.info(
        {
          workerId: this.workerId,
          restartCount: this.restartCount,
        },
        'Respawning worker',
      );
    }

    // Note: busy and pending already cleared in handleCrash()
    (this as { worker: Worker }).worker = this.createWorker();

    // Trigger dispatch to give new worker work
    this.pool.triggerDispatch();
  }

  private handleLogMessage(msg: WorkerLogMessage): void {
    const logger = this.pool.logger;
    if (!logger) return;
    const attrs = { ...msg.attrs, workerId: this.workerId };
    const validLevels: ReadonlySet<string> = new Set(['error', 'warn', 'info', 'debug']);
    if (!validLevels.has(msg.level)) return;
    logger[msg.level](attrs, msg.message);
  }

  execute(requests: FetchRequest[]): Promise<WorkerFetchResult[]> {
    this.busy = true;
    this.currentBatch = requests;
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
 * Queue-based architecture:
 * 1. `fetchBatch(requests)` adds requests to shared queue
 * 2. Workers continuously pull WORKER_BATCH_SIZE requests from queue
 * 3. Failed retryable requests re-enter queue after per-request backoff
 * 4. Concurrent fetchBatch() calls merge into queue and resolve independently
 */
export class MetadataWorkerPool implements IMetadataWorkerPool {
  private readonly workers: PoolWorker[];
  private readonly maxRetries: number;
  private readonly retryBaseDelayMs: number;
  readonly logger: pino.Logger | null; // Make accessible to PoolWorker
  private isShutdown = false;

  // Queue-based state
  private queue: FetchRequest[] = []; // Work waiting to be assigned
  private inFlight: Map<string, FetchRequest> = new Map(); // Currently being processed
  private results: Map<string, FetchResult> = new Map(); // Completed results
  private retryCount: Map<string, number> = new Map(); // Per-request retry tracking
  private pendingBatches: Map<
    string,
    {
      // Track concurrent fetchBatch calls
      requestIds: Set<string>;
      resolve: (results: FetchResult[]) => void;
      reject: (error: Error) => void;
    }
  > = new Map();
  private requestToBatch: Map<string, string> = new Map(); // Map request ID to batch ID
  private originalRequests: Map<string, FetchRequest> = new Map(); // Store for retry
  private readonly workerBatchSize: number;

  constructor(config: MetadataWorkerPoolConfig = {}) {
    const poolSize = config.poolSize ?? 4;
    const ipfsGateway = config.ipfsGateway ?? IPFS_GATEWAY;
    const requestTimeoutMs = config.requestTimeoutMs ?? 30_000;
    this.maxRetries = config.maxRetries ?? FETCH_RETRY_COUNT;
    this.retryBaseDelayMs = config.retryBaseDelayMs ?? 1_000;
    this.workerBatchSize = config.workerBatchSize ?? WORKER_BATCH_SIZE;

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
      (_, i) => new PoolWorker(workerPath, workerData, i, this),
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
          workerBatchSize: this.workerBatchSize,
        },
        'MetadataWorkerPool initialized (queue-based)',
      );
    }
  }

  /**
   * Fetch a batch of metadata URLs using the worker pool.
   *
   * Adds requests to shared queue, returns when all complete.
   * Workers continuously pull from queue in background.
   *
   * @returns One FetchResult per input FetchRequest (order not guaranteed).
   */
  async fetchBatch(requests: FetchRequest[]): Promise<FetchResult[]> {
    if (this.isShutdown) throw new Error('MetadataWorkerPool has been shut down');
    if (requests.length === 0) return [];

    return new Promise((resolve, reject) => {
      const batchId = crypto.randomUUID();
      const requestIds = new Set(requests.map((r) => r.id));

      // Register this batch
      this.pendingBatches.set(batchId, { requestIds, resolve, reject });

      // Add all requests to queue with batch reference
      for (const req of requests) {
        this.requestToBatch.set(req.id, batchId);
        this.originalRequests.set(req.id, req);
        this.queue.push(req);
      }

      // Log batch start
      if (this.logger?.isLevelEnabled?.('debug')) {
        this.logger.debug(
          {
            batchId,
            requestCount: requests.length,
            queueSize: this.queue.length,
          },
          'fetchBatch: added requests to queue',
        );
      }

      // Start dispatching
      this.dispatchWork();
    });
  }

  /**
   * Core queue dispatch loop — assign work to idle workers.
   */
  private dispatchWork(): void {
    for (const worker of this.workers) {
      if (worker.isDead) continue; // Skip permanently dead workers
      if (!worker.busy && this.queue.length > 0) {
        const batch = this.queue.splice(0, this.workerBatchSize);

        // Track in-flight
        for (const req of batch) {
          this.inFlight.set(req.id, req);
        }

        if (this.logger?.isLevelEnabled?.('debug')) {
          this.logger.debug(
            {
              workerId: this.workers.indexOf(worker),
              batchSize: batch.length,
              queueRemaining: this.queue.length,
              inFlightTotal: this.inFlight.size,
            },
            'dispatchWork: assigning batch to worker',
          );
        }

        worker
          .execute(batch)
          .then((results) => {
            this.handleWorkerResults(results);
            // Immediately check for more work
            this.dispatchWork();
          })
          .catch((error) => {
            // Worker error — re-queue all in-flight from this batch (no retry increment)
            this.handleWorkerError(batch, error);
            this.dispatchWork();
          });
      }
    }
  }

  /**
   * Process results from worker completion.
   */
  private handleWorkerResults(workerResults: WorkerFetchResult[]): void {
    for (const result of workerResults) {
      // Remove from in-flight
      this.inFlight.delete(result.id);

      if (result.success) {
        this.results.set(result.id, {
          id: result.id,
          entityType: result.entityType,
          success: true,
          data: result.data,
        });
        this.checkBatchCompletion(result.id);
      } else if (result.retryable) {
        const currentRetries = this.retryCount.get(result.id) ?? 0;
        if (currentRetries < this.maxRetries) {
          this.scheduleRetry(result.id, currentRetries);
        } else {
          // Exhausted retries — record failure
          this.results.set(result.id, {
            id: result.id,
            entityType: result.entityType,
            success: false,
            error: result.error,
            errorCode: result.errorCode,
            errorStatus: result.errorStatus,
          });
          this.checkBatchCompletion(result.id);
        }
      } else {
        // Non-retryable failure
        this.results.set(result.id, {
          id: result.id,
          entityType: result.entityType,
          success: false,
          error: result.error,
          errorCode: result.errorCode,
          errorStatus: result.errorStatus,
        });
        this.checkBatchCompletion(result.id);
      }
    }
  }

  /**
   * Schedule per-request retry after exponential backoff.
   */
  private scheduleRetry(requestId: string, attempt: number): void {
    const delay = this.retryBaseDelayMs * Math.pow(2, attempt);
    this.retryCount.set(requestId, attempt + 1);

    // Find original request
    const batchId = this.requestToBatch.get(requestId);
    const batch = batchId ? this.pendingBatches.get(batchId) : undefined;

    if (!batch) {
      // Batch already resolved/rejected — skip retry
      return;
    }

    if (this.logger?.isLevelEnabled?.('debug')) {
      this.logger.debug(
        {
          requestId,
          attempt: attempt + 1,
          delayMs: delay,
        },
        'scheduleRetry: scheduling retry after backoff',
      );
    }

    setTimeout(() => {
      // Don't retry if pool has been shut down
      if (this.isShutdown) return;

      // Re-find the original request from stored originals
      const original = this.originalRequests.get(requestId);
      if (original) {
        this.queue.push(original);
        this.dispatchWork();
      }
    }, delay);
  }

  /**
   * Check if batch is complete and resolve if so.
   */
  private checkBatchCompletion(requestId: string): void {
    const batchId = this.requestToBatch.get(requestId);
    if (!batchId) return;

    const batch = this.pendingBatches.get(batchId);
    if (!batch) return;

    // Check if all requests from this batch have results
    const allComplete = [...batch.requestIds].every((id) => this.results.has(id));

    if (allComplete) {
      // Gather results for this batch
      const batchResults: FetchResult[] = [];
      for (const id of batch.requestIds) {
        const result = this.results.get(id);
        if (result) batchResults.push(result);
      }

      if (this.logger?.isLevelEnabled?.('debug')) {
        const successCount = batchResults.filter((r) => r.success).length;
        this.logger.debug(
          {
            batchId,
            totalResults: batchResults.length,
            successCount,
            failureCount: batchResults.length - successCount,
          },
          'checkBatchCompletion: batch complete',
        );
      }

      // Clean up batch tracking
      for (const id of batch.requestIds) {
        this.results.delete(id);
        this.retryCount.delete(id);
        this.requestToBatch.delete(id);
        this.originalRequests.delete(id);
      }
      this.pendingBatches.delete(batchId);

      // Resolve the promise
      batch.resolve(batchResults);
    }
  }

  /**
   * Re-queue requests from worker error (no retry count increment).
   */
  private handleWorkerError(batch: FetchRequest[], error: Error): void {
    if (this.logger?.isLevelEnabled?.('warn')) {
      this.logger.warn(
        {
          error: error.message,
          affectedRequests: batch.length,
        },
        'handleWorkerError: worker failed, re-queuing requests',
      );
    }

    // Re-queue all requests from this batch (no retry count increment — worker died, not request failure)
    for (const req of batch) {
      this.inFlight.delete(req.id);
      this.queue.push(req);
    }
  }

  /**
   * Re-queue requests from worker crash (called by PoolWorker).
   */
  handleWorkerCrash(requests: FetchRequest[]): void {
    if (this.logger?.isLevelEnabled?.('debug')) {
      this.logger.debug(
        {
          requestCount: requests.length,
        },
        'handleWorkerCrash: re-queuing requests from crashed worker',
      );
    }

    // Re-queue all requests (no retry count increment)
    for (const req of requests) {
      this.inFlight.delete(req.id);
      this.queue.push(req);
    }
  }

  /**
   * Trigger dispatch from PoolWorker (called after respawn).
   */
  triggerDispatch(): void {
    this.dispatchWork();
  }

  /**
   * Gracefully shut down all worker threads.
   */
  async shutdown(): Promise<void> {
    if (this.isShutdown) return;

    if (this.logger?.isLevelEnabled?.('debug')) {
      this.logger.debug(
        {
          workerCount: this.workers.length,
          pendingBatches: this.pendingBatches.size,
        },
        'Shutting down MetadataWorkerPool',
      );
    }

    this.isShutdown = true;

    // Reject all pending batches
    for (const [, batch] of this.pendingBatches) {
      batch.reject(new Error('MetadataWorkerPool shut down'));
    }
    this.pendingBatches.clear();

    // Clear internal state to avoid retaining references after shutdown
    this.queue = [];
    this.inFlight.clear();
    this.results.clear();
    this.retryCount.clear();
    this.requestToBatch.clear();
    this.originalRequests.clear();

    await Promise.all(this.workers.map((w) => w.terminate()));

    if (this.logger?.isLevelEnabled?.('debug')) {
      this.logger.debug({}, 'MetadataWorkerPool shutdown complete');
    }
  }
}
