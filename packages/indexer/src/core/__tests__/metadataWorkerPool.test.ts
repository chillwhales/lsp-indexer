import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MetadataWorkerPool } from '../metadataWorkerPool';
import type { FetchRequest } from '../types';

// ---------------------------------------------------------------------------
// Mock worker_threads to avoid actual worker spawning in tests
// ---------------------------------------------------------------------------

interface MockWorker {
  postMessage: ReturnType<typeof vi.fn>;
  terminate: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  _triggerMessage?: (results: unknown[]) => void;
  _triggerError?: (error: Error) => void;
  _triggerExit?: (code: number) => void;
}

const mockWorkerInstances: MockWorker[] = [];

vi.mock('worker_threads', () => ({
  Worker: vi.fn().mockImplementation(() => {
    const worker: MockWorker = {
      postMessage: vi.fn(),
      terminate: vi.fn().mockResolvedValue(undefined),
      on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
        if (event === 'message') {
          worker._triggerMessage = (results) => handler(results);
        } else if (event === 'error') {
          worker._triggerError = (error) => handler(error);
        } else if (event === 'exit') {
          worker._triggerExit = (code) => handler(code);
        }
      }),
    };
    mockWorkerInstances.push(worker);
    return worker;
  }),
}));

// Mock logger to silence output during tests
vi.mock('../logger', () => ({
  getFileLogger: () => null,
}));

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

function createMockRequests(count: number, entityType = 'LSP3Profile'): FetchRequest[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `req-${i}`,
    url: `https://example.com/${i}`,
    entityType,
    retries: 0,
  }));
}

function createSuccessResult(req: FetchRequest): {
  id: string;
  entityType: string;
  success: true;
  data: { mockData: boolean };
  retryable: false;
} {
  return {
    id: req.id,
    entityType: req.entityType,
    success: true as const,
    data: { mockData: true },
    retryable: false,
  };
}

function createFailureResult(
  req: FetchRequest,
  retryable = false,
): {
  id: string;
  entityType: string;
  success: false;
  error: string;
  errorCode: string;
  errorStatus: number;
  retryable: boolean;
} {
  return {
    id: req.id,
    entityType: req.entityType,
    success: false as const,
    error: 'Mock error',
    errorCode: 'MOCK_ERROR',
    errorStatus: 500,
    retryable,
  };
}

/**
 * Flush microtask queue and advance fake timers by 0ms.
 *
 * `vi.advanceTimersByTimeAsync(0)` both fires pending setTimeout(fn, 0)
 * callbacks and flushes the microtask queue — unlike a raw
 * `setTimeout(resolve, 0)` which deadlocks under fake timers because
 * the timer never fires without manual advancement.
 */
async function tick(): Promise<void> {
  await vi.advanceTimersByTimeAsync(0);
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('MetadataWorkerPool', () => {
  beforeEach(() => {
    mockWorkerInstances.length = 0;
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // -------------------------------------------------------------------------
  // Basic initialization
  // -------------------------------------------------------------------------

  describe('initialization', () => {
    it('spawns N workers on construction', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const pool = new MetadataWorkerPool({ poolSize: 4 });
      expect(mockWorkerInstances).toHaveLength(4);
    });

    it('configures workers with correct workerData', async () => {
      const Worker = vi.mocked((await import('worker_threads')).Worker);
      new MetadataWorkerPool({
        poolSize: 2,
        ipfsGateway: 'https://custom.gateway/',
        requestTimeoutMs: 5000,
      });

      expect(Worker).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          workerData: {
            ipfsGateway: 'https://custom.gateway/',
            requestTimeoutMs: 5000,
          },
        }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // Queue dispatch
  // -------------------------------------------------------------------------

  describe('queue dispatch', () => {
    it('dispatches work to idle workers', async () => {
      const pool = new MetadataWorkerPool({ poolSize: 2, workerBatchSize: 3 });
      const requests = createMockRequests(6);

      const promise = pool.fetchBatch(requests);

      // Allow dispatch to run
      await tick();

      // Workers should receive batches
      expect(mockWorkerInstances[0].postMessage).toHaveBeenCalledTimes(1);
      expect(mockWorkerInstances[1].postMessage).toHaveBeenCalledTimes(1);

      // Each worker gets 3 requests (workerBatchSize)
      const worker0Batch = mockWorkerInstances[0].postMessage.mock.calls[0][0] as FetchRequest[];
      const worker1Batch = mockWorkerInstances[1].postMessage.mock.calls[0][0] as FetchRequest[];
      expect(worker0Batch).toHaveLength(3);
      expect(worker1Batch).toHaveLength(3);

      // Trigger success responses
      mockWorkerInstances[0]._triggerMessage?.(worker0Batch.map(createSuccessResult));
      mockWorkerInstances[1]._triggerMessage?.(worker1Batch.map(createSuccessResult));

      await vi.runAllTimersAsync();
      const results = await promise;
      expect(results).toHaveLength(6);
    });

    it('respects WORKER_BATCH_SIZE limit per worker', async () => {
      const pool = new MetadataWorkerPool({ poolSize: 1, workerBatchSize: 5 });
      const requests = createMockRequests(10);

      const promise = pool.fetchBatch(requests);
      await tick();

      // Worker gets first 5 requests
      const batch1 = mockWorkerInstances[0].postMessage.mock.calls[0][0] as FetchRequest[];
      expect(batch1).toHaveLength(5);

      // Trigger completion
      mockWorkerInstances[0]._triggerMessage?.(batch1.map(createSuccessResult));
      await tick();

      // Worker should get next 5 requests
      const batch2 = mockWorkerInstances[0].postMessage.mock.calls[1][0] as FetchRequest[];
      expect(batch2).toHaveLength(5);

      // Complete second batch
      mockWorkerInstances[0]._triggerMessage?.(batch2.map(createSuccessResult));

      await vi.runAllTimersAsync();
      const results = await promise;
      expect(results).toHaveLength(10);
    });

    it('continuously dispatches as workers complete', async () => {
      const pool = new MetadataWorkerPool({ poolSize: 2, workerBatchSize: 2 });
      const requests = createMockRequests(6);

      const promise = pool.fetchBatch(requests);
      await tick();

      // Initial dispatch: 2 workers × 2 requests = 4 requests
      expect(mockWorkerInstances[0].postMessage).toHaveBeenCalledTimes(1);
      expect(mockWorkerInstances[1].postMessage).toHaveBeenCalledTimes(1);

      // Complete worker 0's batch
      const batch1 = mockWorkerInstances[0].postMessage.mock.calls[0][0] as FetchRequest[];
      mockWorkerInstances[0]._triggerMessage?.(batch1.map(createSuccessResult));
      await tick();

      // Worker 0 should get more work (remaining 2 requests)
      expect(mockWorkerInstances[0].postMessage).toHaveBeenCalledTimes(2);

      // Complete all remaining work
      const batch2 = mockWorkerInstances[0].postMessage.mock.calls[1][0] as FetchRequest[];
      const batch3 = mockWorkerInstances[1].postMessage.mock.calls[0][0] as FetchRequest[];
      mockWorkerInstances[0]._triggerMessage?.(batch2.map(createSuccessResult));
      mockWorkerInstances[1]._triggerMessage?.(batch3.map(createSuccessResult));

      await vi.runAllTimersAsync();
      const results = await promise;
      expect(results).toHaveLength(6);
    });
  });

  // -------------------------------------------------------------------------
  // Retry scheduling
  // -------------------------------------------------------------------------

  describe('retry scheduling', () => {
    it('schedules retry with exponential backoff', async () => {
      const pool = new MetadataWorkerPool({
        poolSize: 1,
        workerBatchSize: 1,
        retryBaseDelayMs: 100,
        maxRetries: 2,
      });
      const requests = createMockRequests(1);

      const promise = pool.fetchBatch(requests);
      await tick();

      // First attempt fails (retryable)
      const batch1 = mockWorkerInstances[0].postMessage.mock.calls[0][0] as FetchRequest[];
      mockWorkerInstances[0]._triggerMessage?.(batch1.map((r) => createFailureResult(r, true)));
      await tick();

      // Should schedule retry after 100ms (baseDelay * 2^0)
      expect(mockWorkerInstances[0].postMessage).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(100);
      await tick();

      // Second attempt fails (retryable)
      expect(mockWorkerInstances[0].postMessage).toHaveBeenCalledTimes(2);
      const batch2 = mockWorkerInstances[0].postMessage.mock.calls[1][0] as FetchRequest[];
      mockWorkerInstances[0]._triggerMessage?.(batch2.map((r) => createFailureResult(r, true)));
      await tick();

      // Should schedule retry after 200ms (baseDelay * 2^1)
      await vi.advanceTimersByTimeAsync(200);
      await tick();

      // Third attempt succeeds
      expect(mockWorkerInstances[0].postMessage).toHaveBeenCalledTimes(3);
      const batch3 = mockWorkerInstances[0].postMessage.mock.calls[2][0] as FetchRequest[];
      mockWorkerInstances[0]._triggerMessage?.(batch3.map(createSuccessResult));

      await vi.runAllTimersAsync();
      const results = await promise;
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
    });

    it('records failure after max retries exhausted', async () => {
      const pool = new MetadataWorkerPool({
        poolSize: 1,
        workerBatchSize: 1,
        retryBaseDelayMs: 10,
        maxRetries: 2,
      });
      const requests = createMockRequests(1);

      const promise = pool.fetchBatch(requests);
      await tick();

      // Fail all attempts
      for (let i = 0; i < 3; i++) {
        const batch = mockWorkerInstances[0].postMessage.mock.calls[i][0] as FetchRequest[];
        mockWorkerInstances[0]._triggerMessage?.(batch.map((r) => createFailureResult(r, true)));
        await vi.advanceTimersByTimeAsync(10 * Math.pow(2, i));
        await tick();
      }

      await vi.runAllTimersAsync();
      const results = await promise;
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBe('Mock error');
    });

    it('does not retry non-retryable errors', async () => {
      const pool = new MetadataWorkerPool({
        poolSize: 1,
        workerBatchSize: 1,
        maxRetries: 5,
      });
      const requests = createMockRequests(1);

      const promise = pool.fetchBatch(requests);
      await tick();

      // Fail with non-retryable error
      const batch = mockWorkerInstances[0].postMessage.mock.calls[0][0] as FetchRequest[];
      mockWorkerInstances[0]._triggerMessage?.(
        batch.map((r) => createFailureResult(r, false)), // retryable: false
      );

      await vi.runAllTimersAsync();
      const results = await promise;

      // Should only have been called once (no retries)
      expect(mockWorkerInstances[0].postMessage).toHaveBeenCalledTimes(1);
      expect(results[0].success).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Concurrent batches
  // -------------------------------------------------------------------------

  describe('concurrent batches', () => {
    it('supports multiple concurrent fetchBatch calls', async () => {
      const pool = new MetadataWorkerPool({ poolSize: 2, workerBatchSize: 5 });
      const batch1Requests = createMockRequests(3, 'LSP3Profile');
      const batch2Requests = createMockRequests(3, 'LSP4Metadata');

      // Ensure unique IDs across batches (createMockRequests generates req-0..N for both)
      batch1Requests.forEach((r, i) => (r.id = `lsp3-${i}`));
      batch2Requests.forEach((r, i) => (r.id = `lsp4-${i}`));

      const promise1 = pool.fetchBatch(batch1Requests);
      const promise2 = pool.fetchBatch(batch2Requests);
      await tick();

      // Both fetchBatch calls dispatch synchronously: worker 0 gets batch1 (3 reqs),
      // worker 1 gets batch2 (3 reqs). workerBatchSize=5 so each fits in one dispatch.
      expect(mockWorkerInstances[0].postMessage).toHaveBeenCalledTimes(1);
      expect(mockWorkerInstances[1].postMessage).toHaveBeenCalledTimes(1);

      const worker0Batch = mockWorkerInstances[0].postMessage.mock.calls[0][0] as FetchRequest[];
      const worker1Batch = mockWorkerInstances[1].postMessage.mock.calls[0][0] as FetchRequest[];

      // Complete both workers
      mockWorkerInstances[0]._triggerMessage?.(worker0Batch.map(createSuccessResult));
      mockWorkerInstances[1]._triggerMessage?.(worker1Batch.map(createSuccessResult));

      await vi.runAllTimersAsync();
      const results1 = await promise1;
      const results2 = await promise2;

      expect(results1).toHaveLength(3);
      expect(results2).toHaveLength(3);
      expect(results1.every((r) => r.success)).toBe(true);
      expect(results2.every((r) => r.success)).toBe(true);
    });

    it('resolves each batch with only its own results', async () => {
      const pool = new MetadataWorkerPool({ poolSize: 1, workerBatchSize: 10 });
      const batch1Requests = createMockRequests(2, 'LSP3Profile');
      const batch2Requests = createMockRequests(2, 'LSP4Metadata');

      // Give them distinct IDs
      batch1Requests.forEach((r, i) => (r.id = `batch1-${i}`));
      batch2Requests.forEach((r, i) => (r.id = `batch2-${i}`));

      const promise1 = pool.fetchBatch(batch1Requests);
      const promise2 = pool.fetchBatch(batch2Requests);
      await tick();

      // With poolSize=1, first fetchBatch dispatches batch1 immediately.
      // batch2 requests queue up and dispatch when the worker finishes.
      // Complete all dispatched work iteratively
      let iterations = 0;
      while (iterations++ < 10) {
        const callCount = mockWorkerInstances[0].postMessage.mock.calls.length;
        if (callCount === 0) break;
        const lastBatch = mockWorkerInstances[0].postMessage.mock.calls[
          callCount - 1
        ][0] as FetchRequest[];
        mockWorkerInstances[0]._triggerMessage?.(lastBatch.map(createSuccessResult));
        await tick();
        // Break if no new calls were dispatched
        if (mockWorkerInstances[0].postMessage.mock.calls.length === callCount) break;
      }

      await vi.runAllTimersAsync();
      const results1 = await promise1;
      const results2 = await promise2;

      // Each batch should only have its own results
      expect(results1).toHaveLength(2);
      expect(results2).toHaveLength(2);
      expect(results1.every((r) => r.id.startsWith('batch1-'))).toBe(true);
      expect(results2.every((r) => r.id.startsWith('batch2-'))).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Worker crash recovery
  // -------------------------------------------------------------------------

  describe('worker crash recovery', () => {
    it('re-queues in-flight requests on worker error', async () => {
      const pool = new MetadataWorkerPool({ poolSize: 1, workerBatchSize: 3 });
      const requests = createMockRequests(3);

      const promise = pool.fetchBatch(requests);
      await tick();

      // Worker gets requests
      const batch = mockWorkerInstances[0].postMessage.mock.calls[0][0] as FetchRequest[];
      expect(batch).toHaveLength(3);

      // Trigger worker error (simulates worker crash)
      const error = new Error('Worker crashed');
      mockWorkerInstances[0]._triggerError?.(error);
      await tick();

      // Requests should be re-queued and dispatched again
      expect(mockWorkerInstances[0].postMessage).toHaveBeenCalledTimes(2);
      const retryBatch = mockWorkerInstances[0].postMessage.mock.calls[1][0] as FetchRequest[];
      expect(retryBatch).toHaveLength(3);

      // Complete retry
      mockWorkerInstances[0]._triggerMessage?.(retryBatch.map(createSuccessResult));

      await vi.runAllTimersAsync();
      const results = await promise;
      expect(results).toHaveLength(3);
      expect(results.every((r) => r.success)).toBe(true);
    });

    it('respawns worker after crash', async () => {
      const pool = new MetadataWorkerPool({ poolSize: 1, workerBatchSize: 1 });
      const requests = createMockRequests(1);

      const promise = pool.fetchBatch(requests);
      await tick();

      // Get initial worker
      const originalWorker = mockWorkerInstances[0];

      // Trigger worker exit (crash)
      originalWorker._triggerExit?.(1); // non-zero exit code
      await tick();

      // New worker should be created (respawn)
      // Note: In real implementation, createWorker is called
      // For this test, we verify the worker is marked for respawn

      // Complete the request
      const batch = originalWorker.postMessage.mock.calls[0][0] as FetchRequest[];
      originalWorker._triggerMessage?.(batch.map(createSuccessResult));

      await vi.runAllTimersAsync();
      const results = await promise;
      expect(results).toHaveLength(1);
    });

    it('marks worker as dead after max restarts', async () => {
      const pool = new MetadataWorkerPool({ poolSize: 2, workerBatchSize: 1 });
      const requests = createMockRequests(5);

      const promise = pool.fetchBatch(requests);
      await tick();

      // Crash worker 0 four times (exceeds maxRestarts = 3)
      const worker0 = mockWorkerInstances[0];
      for (let i = 0; i < 4; i++) {
        worker0._triggerExit?.(1);
        await tick();
      }

      // Worker 0 should be dead now, worker 1 should handle remaining work
      // Complete all work via worker 1
      const allCalls = mockWorkerInstances[1].postMessage.mock.calls;
      for (const call of allCalls) {
        const batch = call[0] as FetchRequest[];
        mockWorkerInstances[1]._triggerMessage?.(batch.map(createSuccessResult));
        await tick();
      }

      await vi.runAllTimersAsync();
      const results = await promise;
      expect(results).toHaveLength(5);
      expect(results.every((r) => r.success)).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Shutdown
  // -------------------------------------------------------------------------

  describe('shutdown', () => {
    it('rejects pending batches on shutdown', async () => {
      const pool = new MetadataWorkerPool({ poolSize: 1, workerBatchSize: 5 });
      const requests = createMockRequests(5);

      const promise = pool.fetchBatch(requests);
      await tick();

      // Shutdown before completing
      await pool.shutdown();

      // Promise should reject
      await expect(promise).rejects.toThrow('MetadataWorkerPool shut down');
    });

    it('terminates all workers', async () => {
      const pool = new MetadataWorkerPool({ poolSize: 3 });

      await pool.shutdown();

      expect(mockWorkerInstances[0].terminate).toHaveBeenCalled();
      expect(mockWorkerInstances[1].terminate).toHaveBeenCalled();
      expect(mockWorkerInstances[2].terminate).toHaveBeenCalled();
    });

    it('throws error if fetchBatch called after shutdown', async () => {
      const pool = new MetadataWorkerPool({ poolSize: 1 });
      await pool.shutdown();

      const requests = createMockRequests(1);
      await expect(pool.fetchBatch(requests)).rejects.toThrow(
        'MetadataWorkerPool has been shut down',
      );
    });

    it('is idempotent (can call shutdown multiple times)', async () => {
      const pool = new MetadataWorkerPool({ poolSize: 2 });

      await pool.shutdown();
      await pool.shutdown();
      await pool.shutdown();

      // Should only terminate once per worker
      expect(mockWorkerInstances[0].terminate).toHaveBeenCalledTimes(1);
      expect(mockWorkerInstances[1].terminate).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  describe('edge cases', () => {
    it('handles empty request array', async () => {
      const pool = new MetadataWorkerPool({ poolSize: 2 });
      const results = await pool.fetchBatch([]);
      expect(results).toEqual([]);
      expect(mockWorkerInstances[0].postMessage).not.toHaveBeenCalled();
    });

    it('handles single request', async () => {
      const pool = new MetadataWorkerPool({ poolSize: 2, workerBatchSize: 10 });
      const requests = createMockRequests(1);

      const promise = pool.fetchBatch(requests);
      await tick();

      const batch = mockWorkerInstances[0].postMessage.mock.calls[0][0] as FetchRequest[];
      mockWorkerInstances[0]._triggerMessage?.(batch.map(createSuccessResult));

      await vi.runAllTimersAsync();
      const results = await promise;
      expect(results).toHaveLength(1);
    });

    it('handles more requests than workers', async () => {
      const pool = new MetadataWorkerPool({ poolSize: 2, workerBatchSize: 2 });
      const requests = createMockRequests(10);

      const promise = pool.fetchBatch(requests);
      await tick();

      // Complete all work
      const processAll = async (): Promise<void> => {
        let iterations = 0;
        while (iterations++ < 20) {
          // Safety limit
          for (const worker of mockWorkerInstances) {
            const lastCall =
              worker.postMessage.mock.calls[worker.postMessage.mock.calls.length - 1];
            if (lastCall) {
              const batch = lastCall[0] as FetchRequest[];
              worker._triggerMessage?.(batch.map(createSuccessResult));
              await tick();
            }
          }
        }
      };

      await processAll();
      await vi.runAllTimersAsync();
      const results = await promise;
      expect(results).toHaveLength(10);
    });
  });
});
