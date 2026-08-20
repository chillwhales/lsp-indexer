import type { Logger } from '@subsquid/pipes';
import { keccak256, toHex } from 'viem';
import type { RuntimeConfig } from '../config/index.js';
import type { NetworkDatabase } from '../db/client.js';
import type { MetadataWorkerConfig } from './config.js';
import { fetchMetadata } from './fetch.js';
import type { MetadataMetrics } from './metrics.js';
import {
  cancelClaimedMetadataJob,
  claimMetadataJobs,
  completeMetadataJob,
  countMetadataJobs,
  failMetadataJob,
  loadClaimedMetadataSource,
  type MetadataJob,
  type MetadataSettlement,
} from './queue.js';

export interface RunMetadataWorkerOptions {
  db: NetworkDatabase;
  runtime: RuntimeConfig;
  config: MetadataWorkerConfig;
  metrics?: MetadataMetrics;
  logger?: Logger;
  signal?: AbortSignal;
  fetchImplementation?: typeof fetch;
  now?: () => Date;
}

export interface MetadataBatchResult {
  claimed: number;
  settlements: Record<MetadataSettlement, number>;
}

function emptySettlements(): Record<MetadataSettlement, number> {
  return { succeeded: 0, retry: 0, failed: 0, cancelled: 0, lost_claim: 0 };
}

/** Return deterministic exponential backoff with bounded per-job jitter. */
export function metadataRetryDelayMs(
  jobId: string,
  attempt: number,
  config: Pick<MetadataWorkerConfig, 'retryBaseMs' | 'retryMaximumMs'>,
): number {
  const exponent = Math.min(Math.max(attempt - 1, 0), 30);
  const uncapped = config.retryBaseMs * 2 ** exponent;
  const base = Math.min(uncapped, config.retryMaximumMs);
  const sample = Number.parseInt(keccak256(toHex(jobId)).slice(2, 10), 16) / 0xffffffff;
  const jittered = Math.round(base * (0.8 + sample * 0.4));
  return Math.min(Math.max(config.retryBaseMs, jittered), config.retryMaximumMs);
}

function recordSettlement(
  options: RunMetadataWorkerOptions,
  job: MetadataJob,
  settlement: MetadataSettlement,
): void {
  options.metrics?.completed.inc(
    { network: options.runtime.network.key, kind: job.kind, outcome: settlement },
    1,
  );
  if (settlement === 'retry') {
    options.metrics?.retries.inc({ network: options.runtime.network.key, kind: job.kind }, 1);
  }
}

async function processClaimedJob(
  options: RunMetadataWorkerOptions,
  job: MetadataJob,
): Promise<MetadataSettlement> {
  const source = await loadClaimedMetadataSource(options.db, options.runtime, job);
  if (source == null) {
    const settlement = await cancelClaimedMetadataJob(
      options.db,
      job,
      options.now?.() ?? new Date(),
    );
    recordSettlement(options, job, settlement);
    return settlement;
  }

  const result = await fetchMetadata(source, {
    ipfsGateway: options.config.ipfsGateway,
    requestTimeoutMs: options.config.requestTimeoutMs,
    maxResponseBytes: options.config.maxResponseBytes,
    maxRedirects: options.config.maxRedirects,
    ...(options.fetchImplementation == null
      ? {}
      : { fetchImplementation: options.fetchImplementation }),
  });
  options.metrics?.fetchDuration.observe(
    { network: options.runtime.network.key, kind: job.kind },
    result.durationMs / 1_000,
  );

  let settlement: MetadataSettlement;
  if (result.ok) {
    const fetchedAt = options.now?.() ?? new Date();
    settlement = await completeMetadataJob(options.db, options.runtime, job, {
      content: result.content,
      contentHash: result.contentHash,
      contentType: result.contentType,
      contentLength: result.contentLength,
      fetchedAt,
    });
    if (settlement === 'succeeded') {
      options.metrics?.responseBytes.observe(
        { network: options.runtime.network.key, kind: job.kind },
        result.contentLength,
      );
    }
  } else {
    const now = options.now?.() ?? new Date();
    const delay = metadataRetryDelayMs(job.id, job.attempts, options.config);
    settlement = await failMetadataJob(options.db, options.runtime, job, {
      error: result.error,
      retryable: result.retryable,
      nextAttemptAt: new Date(now.getTime() + delay),
      now,
      maxAttempts: options.config.maxAttempts,
    });
  }
  recordSettlement(options, job, settlement);
  return settlement;
}

async function updateBacklogMetrics(options: RunMetadataWorkerOptions): Promise<void> {
  if (options.metrics == null) return;
  for (const row of await countMetadataJobs(options.db, options.runtime)) {
    options.metrics.backlog.set(
      { network: options.runtime.network.key, status: row.status },
      row.count,
    );
  }
}

/** Claim and process at most one bounded finalized batch for a network. */
export async function processMetadataBatch(
  options: RunMetadataWorkerOptions,
): Promise<MetadataBatchResult> {
  const claimedAt = options.now?.() ?? new Date();
  const jobs = await claimMetadataJobs(options.db, options.runtime, {
    limit: options.config.concurrency,
    leaseTimeoutMs: options.config.leaseTimeoutMs,
    now: claimedAt,
  });
  for (const job of jobs) {
    options.metrics?.claimed.inc({ network: options.runtime.network.key, kind: job.kind }, 1);
    options.metrics?.queueLatency.observe(
      { network: options.runtime.network.key, kind: job.kind },
      Math.max(0, claimedAt.getTime() - job.createdAt.getTime()) / 1_000,
    );
  }

  const settlements = emptySettlements();
  const results = await Promise.allSettled(jobs.map((job) => processClaimedJob(options, job)));
  for (let index = 0; index < results.length; index++) {
    const result = results[index];
    const job = jobs[index];
    if (result == null || job == null) continue;
    if (result.status === 'fulfilled') {
      settlements[result.value] += 1;
    } else {
      options.logger?.error(
        {
          network: options.runtime.network.key,
          jobId: job.id,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        },
        'Metadata job processing failed before settlement; its lease will recover it',
      );
    }
  }
  await updateBacklogMetrics(options);
  return { claimed: jobs.length, settlements };
}

function waitForNextPoll(milliseconds: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted === true) return Promise.resolve();
  return new Promise((resolve) => {
    const timeout = setTimeout(resolve, milliseconds);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timeout);
        resolve();
      },
      { once: true },
    );
  });
}

function isAborted(signal?: AbortSignal): boolean {
  return signal?.aborted === true;
}

/** Drain one network independently until aborted, sleeping only when no finalized job is ready. */
export async function runMetadataWorker(options: RunMetadataWorkerOptions): Promise<void> {
  while (true) {
    if (isAborted(options.signal)) return;
    let result: MetadataBatchResult;
    try {
      result = await processMetadataBatch(options);
    } catch (error) {
      options.logger?.error(
        {
          network: options.runtime.network.key,
          error: error instanceof Error ? error.message : String(error),
        },
        'Metadata batch failed; retrying after the poll interval',
      );
      if (options.config.runOnce) throw error;
      await waitForNextPoll(options.config.pollIntervalMs, options.signal);
      continue;
    }
    if (options.config.runOnce || isAborted(options.signal)) return;
    if (result.claimed === 0) {
      await waitForNextPoll(options.config.pollIntervalMs, options.signal);
    }
  }
}
