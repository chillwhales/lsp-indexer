import type { Logger } from '@subsquid/pipes';
import { toHex } from 'viem';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadRuntimeConfig } from '../../config/index.js';
import type { NetworkDatabase } from '../../db/client.js';
import type { MetadataWorkerConfig } from '../config.js';
import type { MetadataMetrics } from '../metrics.js';
import type { MetadataJob } from '../queue.js';
import type { MetadataSource } from '../source.js';

const queueMocks = vi.hoisted(() => ({
  cancel: vi.fn(),
  claim: vi.fn(),
  complete: vi.fn(),
  count: vi.fn(),
  fail: vi.fn(),
  load: vi.fn(),
}));
const fetchMock = vi.hoisted(() => vi.fn());

vi.mock('../queue.js', () => ({
  cancelClaimedMetadataJob: queueMocks.cancel,
  claimMetadataJobs: queueMocks.claim,
  completeMetadataJob: queueMocks.complete,
  countMetadataJobs: queueMocks.count,
  failMetadataJob: queueMocks.fail,
  loadClaimedMetadataSource: queueMocks.load,
}));
vi.mock('../fetch.js', () => ({ fetchMetadata: fetchMock }));

import {
  metadataFailureReason,
  metadataRetryDelayMs,
  processMetadataBatch,
  runMetadataWorker,
} from '../worker.js';

const runtime = loadRuntimeConfig({ INDEXER_NETWORK: 'ethereum-mainnet' });
const now = new Date('2026-01-01T00:00:00Z');

function createConfig(overrides: Partial<MetadataWorkerConfig> = {}): MetadataWorkerConfig {
  return {
    concurrency: 2,
    pollIntervalMs: 50,
    requestTimeoutMs: 1_000,
    maxResponseBytes: 4_096,
    maxRedirects: 2,
    maxAttempts: 3,
    retryBaseMs: 100,
    retryMaximumMs: 1_000,
    leaseTimeoutMs: 2_000,
    metricsPort: 9_091,
    ipfsGateways: ['https://gateway.example.test/ipfs'],
    allowHttp: false,
    runOnce: true,
    ...overrides,
  };
}

function createJob(overrides: Partial<MetadataJob> = {}): MetadataJob {
  return {
    id: 'metadata-job',
    network: runtime.network.key,
    chainId: runtime.network.chainId,
    kind: 'lsp3_profile',
    status: 'processing',
    address: '0x0000000000000000000000000000000000000010',
    tokenId: null,
    dataKey: toHex(1n, { size: 32 }),
    sourceRevision: toHex(2n, { size: 32 }),
    contentUri: 'https://metadata.example.test/profile.json',
    contentHash: toHex(3n, { size: 32 }),
    sourceBlockNumber: 100,
    sourceBlockHash: toHex(100n, { size: 32 }),
    attempts: 1,
    nextAttemptAt: now,
    claimedAt: now,
    lastError: null,
    createdAt: new Date('2025-12-31T23:59:50Z'),
    updatedAt: now,
    ...overrides,
  };
}

function createSource(job: MetadataJob): MetadataSource {
  return {
    id: job.id,
    network: job.network,
    chainId: job.chainId,
    kind: job.kind,
    address: job.address,
    tokenId: job.tokenId,
    dataKey: job.dataKey,
    sourceRevision: job.sourceRevision,
    contentUri: job.contentUri,
    contentHash: job.contentHash,
    verificationMethod: '0x8019f9b1',
    lastBlockNumber: job.sourceBlockNumber,
    lastBlockHash: job.sourceBlockHash,
    lastTransactionHash: null,
    lastTransactionIndex: null,
    lastLogIndex: null,
  };
}

function createMetrics(): {
  metrics: MetadataMetrics;
  calls: {
    claimed: ReturnType<typeof vi.fn>;
    completed: ReturnType<typeof vi.fn>;
    retries: ReturnType<typeof vi.fn>;
    failures: ReturnType<typeof vi.fn>;
    backlog: ReturnType<typeof vi.fn>;
    oldestAge: ReturnType<typeof vi.fn>;
    maximumAttempts: ReturnType<typeof vi.fn>;
    attempts: ReturnType<typeof vi.fn>;
    fetchDuration: ReturnType<typeof vi.fn>;
    queueLatency: ReturnType<typeof vi.fn>;
    responseBytes: ReturnType<typeof vi.fn>;
  };
} {
  const calls = {
    claimed: vi.fn(),
    completed: vi.fn(),
    retries: vi.fn(),
    failures: vi.fn(),
    backlog: vi.fn(),
    oldestAge: vi.fn(),
    maximumAttempts: vi.fn(),
    attempts: vi.fn(),
    fetchDuration: vi.fn(),
    queueLatency: vi.fn(),
    responseBytes: vi.fn(),
  };
  const metrics = {
    claimed: { inc: calls.claimed },
    completed: { inc: calls.completed },
    retries: { inc: calls.retries },
    failures: { inc: calls.failures },
    backlog: { set: calls.backlog },
    oldestAge: { set: calls.oldestAge },
    maximumAttempts: { set: calls.maximumAttempts },
    attempts: { observe: calls.attempts },
    fetchDuration: { observe: calls.fetchDuration },
    queueLatency: { observe: calls.queueLatency },
    responseBytes: { observe: calls.responseBytes },
  };
  // Metrics are deliberately narrowed to the methods exercised by the worker.
  return { metrics: metrics as unknown as MetadataMetrics, calls };
}

function createDatabase(): NetworkDatabase {
  // Queue access is mocked; the worker treats the database as an opaque dependency.
  return {} as NetworkDatabase;
}

beforeEach(() => {
  vi.clearAllMocks();
  queueMocks.claim.mockResolvedValue([]);
  queueMocks.count.mockResolvedValue([]);
});

describe('metadata worker', () => {
  it('uses deterministic bounded exponential retry delay', () => {
    const config = createConfig();
    const first = metadataRetryDelayMs('job-a', 1, config);
    expect(first).toBeGreaterThanOrEqual(100);
    expect(first).toBeLessThanOrEqual(120);
    expect(metadataRetryDelayMs('job-a', 1, config)).toBe(first);
    expect(metadataRetryDelayMs('job-a', 4, config)).toBeGreaterThan(first);
    expect(metadataRetryDelayMs('job-a', 100, config)).toBeLessThanOrEqual(1_000);
    expect(metadataRetryDelayMs('job-a', 0, config)).toBe(first);
    expect(metadataFailureReason('Metadata request timed out')).toBe('timeout');
    expect(metadataFailureReason('getaddrinfo ENOTFOUND metadata.example')).toBe('dns');
    expect(metadataFailureReason('connect ECONNREFUSED 203.0.113.1:443')).toBe('transport');
    expect(metadataFailureReason('Metadata request failed with HTTP 503')).toBe('http_server');
    expect(metadataFailureReason('Metadata content hash does not match')).toBe('verification');
  });

  it('publishes a successful current source and records lifecycle metrics', async () => {
    const job = createJob();
    const source = createSource(job);
    const { metrics, calls } = createMetrics();
    queueMocks.claim.mockResolvedValue([job]);
    queueMocks.load.mockResolvedValue(source);
    queueMocks.complete.mockResolvedValue('succeeded');
    queueMocks.count.mockResolvedValue([
      {
        status: 'pending',
        count: 2,
        oldestCreatedAt: new Date('2025-12-31T23:59:40Z'),
        maximumAttempts: 2,
      },
      { status: 'succeeded', count: 1, oldestCreatedAt: now, maximumAttempts: 1 },
    ]);
    fetchMock.mockResolvedValue({
      ok: true,
      content: { LSP3Profile: { name: 'Alice' } },
      contentHash: job.contentHash,
      contentType: 'application/json',
      contentLength: 42,
      durationMs: 250,
    });

    const result = await processMetadataBatch({
      db: createDatabase(),
      runtime,
      config: createConfig(),
      metrics,
      now: () => now,
    });

    expect(result).toEqual({
      claimed: 1,
      settlements: { succeeded: 1, retry: 0, failed: 0, cancelled: 0, lost_claim: 0 },
    });
    expect(queueMocks.complete).toHaveBeenCalledWith(
      expect.anything(),
      runtime,
      job,
      expect.objectContaining({ fetchedAt: now, contentLength: 42 }),
    );
    expect(calls.claimed).toHaveBeenCalledOnce();
    expect(calls.completed).toHaveBeenCalledWith(
      { network: 'ethereum-mainnet', kind: 'lsp3_profile', outcome: 'succeeded' },
      1,
    );
    expect(calls.fetchDuration).toHaveBeenCalledWith(
      { network: 'ethereum-mainnet', kind: 'lsp3_profile' },
      0.25,
    );
    expect(calls.queueLatency).toHaveBeenCalledWith(
      { network: 'ethereum-mainnet', kind: 'lsp3_profile' },
      10,
    );
    expect(calls.responseBytes).toHaveBeenCalledWith(
      { network: 'ethereum-mainnet', kind: 'lsp3_profile' },
      42,
    );
    expect(calls.backlog).toHaveBeenCalledTimes(2);
    expect(calls.oldestAge).toHaveBeenCalledWith(
      { network: 'ethereum-mainnet', status: 'pending' },
      20,
    );
    expect(calls.maximumAttempts).toHaveBeenCalledWith(
      { network: 'ethereum-mainnet', status: 'pending' },
      2,
    );
    expect(calls.attempts).toHaveBeenCalledWith(
      { network: 'ethereum-mainnet', kind: 'lsp3_profile' },
      1,
    );
  });

  it('cancels a stale source before fetching it', async () => {
    const job = createJob();
    queueMocks.claim.mockResolvedValue([job]);
    queueMocks.load.mockResolvedValue(null);
    queueMocks.cancel.mockResolvedValue('cancelled');

    await expect(
      processMetadataBatch({
        db: createDatabase(),
        runtime,
        config: createConfig(),
        now: () => now,
      }),
    ).resolves.toEqual({
      claimed: 1,
      settlements: { succeeded: 0, retry: 0, failed: 0, cancelled: 1, lost_claim: 0 },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('schedules retryable failures and records retry metrics', async () => {
    const job = createJob({ attempts: 2 });
    const { metrics, calls } = createMetrics();
    queueMocks.claim.mockResolvedValue([job]);
    queueMocks.load.mockResolvedValue(createSource(job));
    queueMocks.fail.mockResolvedValue('retry');
    fetchMock.mockResolvedValue({
      ok: false,
      error: 'HTTP 503',
      retryable: true,
      durationMs: 50,
    });

    const result = await processMetadataBatch({
      db: createDatabase(),
      runtime,
      config: createConfig(),
      metrics,
      now: () => now,
    });

    expect(result.settlements.retry).toBe(1);
    expect(queueMocks.fail).toHaveBeenCalledWith(
      expect.anything(),
      runtime,
      job,
      expect.objectContaining({
        error: 'HTTP 503',
        retryable: true,
        now,
        maxAttempts: 3,
      }),
    );
    expect(calls.retries).toHaveBeenCalledOnce();
    expect(calls.failures).toHaveBeenCalledWith(
      { network: 'ethereum-mainnet', kind: 'lsp3_profile', reason: 'http_server' },
      1,
    );
  });

  it('isolates an unexpected job exception until its lease expires', async () => {
    const first = createJob({ id: 'first-job' });
    const second = createJob({ id: 'second-job' });
    const error = vi.fn();
    const logger = { error } as unknown as Logger;
    queueMocks.claim.mockResolvedValue([first, second]);
    queueMocks.load.mockImplementation((_, __, job: MetadataJob) => {
      if (job.id === first.id) throw new Error('database disconnected');
      return Promise.resolve(null);
    });
    queueMocks.cancel.mockResolvedValue('cancelled');

    const result = await processMetadataBatch({
      db: createDatabase(),
      runtime,
      config: createConfig(),
      logger,
      now: () => now,
    });

    expect(result.claimed).toBe(2);
    expect(result.settlements.cancelled).toBe(1);
    expect(error).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: 'first-job', error: 'database disconnected' }),
      expect.stringContaining('lease will recover'),
    );
  });

  it('honors one-shot mode and an already-aborted process', async () => {
    await runMetadataWorker({
      db: createDatabase(),
      runtime,
      config: createConfig({ runOnce: true }),
    });
    expect(queueMocks.claim).toHaveBeenCalledOnce();

    queueMocks.claim.mockClear();
    const controller = new AbortController();
    controller.abort();
    await runMetadataWorker({
      db: createDatabase(),
      runtime,
      config: createConfig({ runOnce: false }),
      signal: controller.signal,
    });
    expect(queueMocks.claim).not.toHaveBeenCalled();
  });

  it('wakes an idle poll immediately when aborted', async () => {
    const controller = new AbortController();
    queueMocks.claim.mockResolvedValue([]);

    const running = runMetadataWorker({
      db: createDatabase(),
      runtime,
      config: createConfig({ runOnce: false, pollIntervalMs: 60_000 }),
      signal: controller.signal,
    });
    await vi.waitFor(() => expect(queueMocks.claim).toHaveBeenCalledOnce());
    controller.abort();
    await running;
    expect(queueMocks.claim).toHaveBeenCalledOnce();
  });

  it('retries a batch-level database failure unless one-shot mode is active', async () => {
    const controller = new AbortController();
    const error = vi.fn();
    const logger = { error } as unknown as Logger;
    queueMocks.claim.mockImplementation(() => {
      controller.abort();
      return Promise.reject(new Error('database unavailable'));
    });

    await runMetadataWorker({
      db: createDatabase(),
      runtime,
      config: createConfig({ runOnce: false, pollIntervalMs: 60_000 }),
      logger,
      signal: controller.signal,
    });
    expect(error).toHaveBeenCalledWith(
      expect.objectContaining({ network: 'ethereum-mainnet', error: 'database unavailable' }),
      expect.stringContaining('retrying'),
    );

    queueMocks.claim.mockRejectedValue(new Error('one-shot failure'));
    await expect(
      runMetadataWorker({
        db: createDatabase(),
        runtime,
        config: createConfig({ runOnce: true }),
      }),
    ).rejects.toThrow('one-shot failure');
  });
});
