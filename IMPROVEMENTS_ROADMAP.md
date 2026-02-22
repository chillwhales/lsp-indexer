# Indexer-v2 Improvements Roadmap

Based on lessons learned from PR #152 debugging process.

---

## 1. Improve Debug Logging Strategy

**Goal:** Make debugging worker pool and metadata fetch issues faster and cleaner.

### Current Problems

- Debug logs mixed with application logs
- Can't enable/disable debug logging without code changes
- No structured logging for worker operations
- Console.log statements everywhere during debugging

### Proposed Solution

#### A. Create Logging Utility

**File:** `packages/indexer-v2/src/utils/logger.ts`

```typescript
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4,
}

export interface LoggerConfig {
  level: LogLevel;
  enableWorkerPool?: boolean;
  enableMetadataFetch?: boolean;
  enablePipeline?: boolean;
}

export class Logger {
  constructor(
    private config: LoggerConfig,
    private namespace: string,
  ) {}

  error(message: string, ...args: unknown[]): void {
    if (this.config.level >= LogLevel.ERROR) {
      console.error(`[${this.namespace}] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.config.level >= LogLevel.WARN) {
      console.warn(`[${this.namespace}] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.config.level >= LogLevel.INFO) {
      console.log(`[${this.namespace}] ${message}`, ...args);
    }
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.config.level >= LogLevel.DEBUG) {
      console.log(`[${this.namespace}:debug] ${message}`, ...args);
    }
  }

  trace(message: string, ...args: unknown[]): void {
    if (this.config.level >= LogLevel.TRACE) {
      console.log(`[${this.namespace}:trace] ${message}`, ...args);
    }
  }
}

// Factory
export function createLogger(namespace: string, config?: Partial<LoggerConfig>): Logger {
  const defaultConfig: LoggerConfig = {
    level: parseLogLevel(process.env.LOG_LEVEL) ?? LogLevel.INFO,
    enableWorkerPool: process.env.DEBUG_WORKER_POOL === 'true',
    enableMetadataFetch: process.env.DEBUG_METADATA_FETCH === 'true',
    enablePipeline: process.env.DEBUG_PIPELINE === 'true',
  };

  return new Logger({ ...defaultConfig, ...config }, namespace);
}
```

#### B. Use in Worker Pool

**File:** `packages/indexer-v2/src/core/metadataWorkerPool.ts`

```typescript
import { createLogger } from '@/utils/logger';

class MetadataWorkerPool {
  private readonly logger = createLogger('MetadataWorkerPool');

  async fetchBatch(requests: FetchRequest[]): Promise<FetchResult[]> {
    this.logger.debug(`Processing ${requests.length} requests`);
    this.logger.trace(`Distributing across ${this.workers.length} workers`);

    // ... implementation

    this.logger.info(`Completed batch: ${success} success, ${failed} failed`);
  }
}
```

#### C. Environment Variables

```bash
# General logging
LOG_LEVEL=info          # error | warn | info | debug | trace

# Component-specific debug flags
DEBUG_WORKER_POOL=true
DEBUG_METADATA_FETCH=true
DEBUG_PIPELINE=false
```

### Benefits

- ✅ Enable debug logging without code changes
- ✅ Component-specific debugging
- ✅ Clean production logs (info level)
- ✅ Detailed debug logs when needed
- ✅ Consistent format across codebase

### Implementation Plan

1. Create logger utility
2. Add to worker pool
3. Add to metadata fetch handlers
4. Add to pipeline
5. Document in README

---

## 2. Refactor Worker Concurrency Model

**Goal:** Keep N workers busy at all times instead of batch-then-wait pattern.

### Current Implementation

```
Step 1: Distribute 1000 requests → 4 workers (250 each)
Step 2: Wait for all workers to complete
Step 3: Process results
Step 4: If failures, retry all failures together
Step 5: Wait again...
```

**Problems:**

- Workers idle during result processing
- Retry all failures at once (inefficient)
- Can't process new work while retrying old work

### Proposed Solution: Queue-Based Worker Pool

#### A. Worker Queue Architecture

```typescript
interface WorkerPoolConfig {
  poolSize: number; // N = 4 (number of worker threads)
  workerBatchSize: number; // X = 250 (requests per worker per batch)
  maxRetries: number; // 6 attempts
  retryBackoffMs: number; // 1000ms base delay
}

class QueuedWorkerPool {
  private workers: Worker[];
  private queue: FetchRequest[] = [];
  private inFlight: Map<string, FetchRequest> = new Map();
  private results: Map<string, FetchResult> = new Map();
  private retryCount: Map<string, number> = new Map();

  async fetchBatch(requests: FetchRequest[]): Promise<FetchResult[]> {
    // Add all requests to queue
    this.queue.push(...requests);

    // Start workers (non-blocking)
    this.startWorkers();

    // Wait for all requests to complete
    await this.waitForCompletion(requests.map((r) => r.id));

    // Return results
    return requests.map((r) => this.results.get(r.id)!);
  }

  private startWorkers(): void {
    // For each idle worker
    for (const worker of this.workers) {
      if (!worker.busy && this.queue.length > 0) {
        // Take up to X requests from queue
        const batch = this.queue.splice(0, this.config.workerBatchSize);

        // Mark as in-flight
        batch.forEach((req) => this.inFlight.set(req.id, req));

        // Send to worker
        worker.execute(batch).then((results) => {
          this.handleResults(results);
          // Recursively start next batch
          this.startWorkers();
        });
      }
    }
  }

  private handleResults(results: FetchResult[]): void {
    for (const result of results) {
      this.inFlight.delete(result.id);

      if (result.success) {
        // Success - store result
        this.results.set(result.id, result);
      } else if (this.shouldRetry(result)) {
        // Retry - add back to queue
        const retries = this.retryCount.get(result.id) ?? 0;
        this.retryCount.set(result.id, retries + 1);

        // Exponential backoff
        const delay = this.config.retryBackoffMs * Math.pow(2, retries);
        setTimeout(() => {
          this.queue.push(this.inFlight.get(result.id)!);
          this.startWorkers();
        }, delay);
      } else {
        // Failed permanently
        this.results.set(result.id, result);
      }
    }
  }
}
```

#### B. Benefits

**Current (Batch-Wait Pattern):**

```
Worker 1: [====250====] wait [====retry====] wait
Worker 2: [====250====] wait [====retry====] wait
Worker 3: [====250====] wait [====retry====] wait
Worker 4: [====250====] wait [====retry====] wait

Total time: ~35 seconds per 1000 requests
```

**Proposed (Queue Pattern):**

```
Worker 1: [==250==][==250==][==250==][retry][retry]...
Worker 2: [==250==][==250==][==250==][retry]...
Worker 3: [==250==][==250==][retry][retry]...
Worker 4: [==250==][retry][retry][retry]...

Total time: ~15-20 seconds per 1000 requests
```

**Improvements:**

- ✅ **No idle time** - workers immediately get next batch
- ✅ **Retry while processing** - failed requests retry in background
- ✅ **Better throughput** - ~2x faster for large backlogs
- ✅ **Fair queueing** - requests processed in order

#### C. Configuration

```typescript
// Environment variables with defaults
const WORKER_POOL_SIZE = process.env.WORKER_POOL_SIZE ?? 4;
const WORKER_BATCH_SIZE = process.env.WORKER_BATCH_SIZE ?? 250;
const FETCH_LIMIT = process.env.FETCH_LIMIT ?? 10_000;
```

**Tuning guide:**

- **Small backlog** (< 1000): `WORKER_BATCH_SIZE=100`, `WORKER_POOL_SIZE=4`
- **Medium backlog** (1k-10k): `WORKER_BATCH_SIZE=250`, `WORKER_POOL_SIZE=4` (default)
- **Large backlog** (> 10k): `WORKER_BATCH_SIZE=500`, `WORKER_POOL_SIZE=8`
- **Memory constrained**: `WORKER_BATCH_SIZE=100`, reduce FETCH_LIMIT
- **IPFS slow**: `WORKER_BATCH_SIZE=50`, increase timeout

### Implementation Plan

1. Create `QueuedWorkerPool` class
2. Add tests (unit + integration)
3. Swap implementation in `metadataWorkerPool.ts`
4. Add metrics (queue size, in-flight count, success/fail rates)
5. Document configuration in README
6. Deploy and monitor

---

## 3. Add Worker Pool Metrics (Optional)

**Goal:** Prometheus metrics for monitoring worker pool health.

### Proposed Metrics

```typescript
// Counters
workerPool.requests.total;
workerPool.requests.success;
workerPool.requests.failed;
workerPool.requests.retried;

// Gauges
workerPool.queue.size;
workerPool.inFlight.count;
workerPool.workers.idle;
workerPool.workers.busy;

// Histograms
workerPool.batch.duration.seconds;
workerPool.request.duration.seconds;
```

### Usage

```bash
# Query in Grafana
rate(workerPool_requests_total[5m])
avg(workerPool_batch_duration_seconds)
workerPool_queue_size
```

---

## Priority Order

1. **PR #152** - Fix worker path, merge immediately ✅ DONE
2. **Logging Strategy** - Next PR, enables better debugging
3. **Queue-Based Pool** - Performance optimization, can wait
4. **Metrics** - Nice to have, lowest priority

---

## Success Criteria

### Logging (PR #2)

- [ ] Can enable debug logging via env var
- [ ] Component-specific debug flags work
- [ ] Production logs are clean (info level)
- [ ] Debug logs show useful information

### Queueing (PR #3)

- [ ] Workers never idle when work available
- [ ] Throughput improves by 30-50%
- [ ] Backlog drains faster
- [ ] Configuration via env vars works
- [ ] No regression in error handling

### Metrics (PR #4)

- [ ] Prometheus metrics exposed
- [ ] Grafana dashboard created
- [ ] Alerts configured
- [ ] Documentation updated
