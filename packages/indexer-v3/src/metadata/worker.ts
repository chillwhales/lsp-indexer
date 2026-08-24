import type { Logger } from '@subsquid/pipes';
import { keccak256, toHex } from 'viem';
import type { RuntimeConfig } from '../config/index.js';
import type { NetworkDatabase } from '../db/client.js';
import type { MetadataWorkerConfig } from './config.js';
import { fetchMetadata, type MetadataRequestImplementation } from './fetch.js';
import type { MetadataMetrics } from './metrics.js';
import {
  claimMetadataJobs,
  completeMetadataJob,
  countMetadataJobs,
  failMetadataJob,
  loadClaimedMetadataSource,
  settleUnavailableMetadataJob,
  type MetadataJob,
  type MetadataSettlement,
} from './queue.js';

const BACKLOG_METRICS_REFRESH_MS = 30_000;

export interface RunMetadataWorkerOptions {
  db: NetworkDatabase;
  runtime: RuntimeConfig;
  config: MetadataWorkerConfig;
  metrics?: MetadataMetrics;
  logger?: Logger;
  signal?: AbortSignal;
  requestImplementation?: MetadataRequestImplementation;
  now?: () => Date;
}

export interface MetadataBatchResult {
  claimed: number;
  settlements: Record<MetadataSettlement, number>;
}

export type MetadataFailureReason =
  | 'timeout'
  | 'dns'
  | 'unsafe_target'
  | 'http_client'
  | 'http_server'
  | 'response_size'
  | 'verification'
  | 'invalid_content'
  | 'unsupported'
  | 'transport'
  | 'unknown';

function emptySettlements(): Record<MetadataSettlement, number> {
  return { succeeded: 0, retry: 0, failed: 0, cancelled: 0, deferred: 0, lost_claim: 0 };
}

/** Convert unbounded transport/parser messages into a stable, low-cardinality metric label. */
export function metadataFailureReason(error: string): MetadataFailureReason {
  const normalized = error.toLowerCase();
  if (normalized.includes('timed out')) return 'timeout';
  if (
    normalized.includes('hostname') ||
    normalized.includes('dns answer') ||
    normalized.includes('getaddrinfo') ||
    normalized.includes('enotfound') ||
    normalized.includes('eai_again')
  ) {
    return 'dns';
  }
  if (
    normalized.includes('non-public') ||
    normalized.includes('local hostname') ||
    normalized.includes('http metadata requests are disabled')
  ) {
    return 'unsafe_target';
  }
  if (/http 4\d\d/.test(normalized)) return 'http_client';
  if (/http 5\d\d/.test(normalized)) return 'http_server';
  if (normalized.includes('byte maximum') || normalized.includes('declares')) {
    return 'response_size';
  }
  if (normalized.includes('hash') || normalized.includes('verification method')) {
    return 'verification';
  }
  if (
    normalized.includes('json') ||
    normalized.includes('utf-8') ||
    normalized.includes('html') ||
    normalized.includes('encoding') ||
    normalized.includes('does not contain')
  ) {
    return 'invalid_content';
  }
  if (normalized.includes('unsupported')) return 'unsupported';
  if (
    normalized.includes('network') ||
    normalized.includes('connection') ||
    normalized.includes('unavailable') ||
    /\beconn(?:aborted|refused|reset)\b/.test(normalized) ||
    /\be(?:host|net)unreach\b/.test(normalized) ||
    /\beproto\b/.test(normalized)
  ) {
    return 'transport';
  }
  return 'unknown';
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
  options.metrics?.attempts.observe(
    { network: options.runtime.network.key, kind: job.kind },
    job.attempts,
  );
}

async function processClaimedJob(
  options: RunMetadataWorkerOptions,
  job: MetadataJob,
): Promise<MetadataSettlement> {
  const current = await loadClaimedMetadataSource(options.db, options.runtime, job);
  if (current.status !== 'current') {
    const settlement = await settleUnavailableMetadataJob(options.db, options.runtime, job);
    recordSettlement(options, job, settlement);
    return settlement;
  }

  const result = await fetchMetadata(current.source, {
    ipfsGateways: options.config.ipfsGateways,
    allowHttp: options.config.allowHttp,
    requestTimeoutMs: options.config.requestTimeoutMs,
    maxResponseBytes: options.config.maxResponseBytes,
    maxRedirects: options.config.maxRedirects,
    ...(options.requestImplementation == null
      ? {}
      : { requestImplementation: options.requestImplementation }),
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
      contentUri: result.contentUri,
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
    const delay = metadataRetryDelayMs(job.id, job.attempts, options.config);
    settlement = await failMetadataJob(options.db, options.runtime, job, {
      error: result.error,
      retryable: result.retryable,
      retryDelayMs: delay,
      maxAttempts: options.config.maxAttempts,
    });
    options.metrics?.failures.inc(
      {
        network: options.runtime.network.key,
        kind: job.kind,
        reason: metadataFailureReason(result.error),
      },
      1,
    );
  }
  recordSettlement(options, job, settlement);
  return settlement;
}

async function updateBacklogMetrics(
  options: RunMetadataWorkerOptions,
  observedAt: Date,
): Promise<void> {
  if (options.metrics == null) return;
  for (const row of await countMetadataJobs(options.db, options.runtime)) {
    options.metrics.backlog.set(
      { network: options.runtime.network.key, status: row.status },
      row.count,
    );
    options.metrics.oldestAge.set(
      { network: options.runtime.network.key, status: row.status },
      row.oldestCreatedAt == null
        ? 0
        : Math.max(0, observedAt.getTime() - row.oldestCreatedAt.getTime()) / 1_000,
    );
    options.metrics.maximumAttempts.set(
      { network: options.runtime.network.key, status: row.status },
      row.maximumAttempts,
    );
  }
}

/** Claim and process at most one bounded finalized batch for a network. */
export async function processMetadataBatch(
  options: RunMetadataWorkerOptions,
): Promise<MetadataBatchResult> {
  const jobs = await claimMetadataJobs(options.db, options.runtime, {
    limit: options.config.concurrency,
    leaseTimeoutMs: options.config.leaseTimeoutMs,
  });
  for (const job of jobs) {
    options.metrics?.claimed.inc({ network: options.runtime.network.key, kind: job.kind }, 1);
    if (job.claimedAt != null) {
      options.metrics?.queueLatency.observe(
        { network: options.runtime.network.key, kind: job.kind },
        Math.max(0, job.claimedAt.getTime() - job.createdAt.getTime()) / 1_000,
      );
    }
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
  return { claimed: jobs.length, settlements };
}

function waitForNextPoll(milliseconds: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted === true) return Promise.resolve();
  return new Promise((resolve) => {
    const timeout = setTimeout(finish, milliseconds);
    function finish(): void {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', finish);
      resolve();
    }
    signal?.addEventListener('abort', finish, { once: true });
    if (signal?.aborted === true) finish();
  });
}

function isAborted(signal?: AbortSignal): boolean {
  return signal?.aborted === true;
}

/** Drain one network independently until aborted, sleeping only when no finalized job is ready. */
export async function runMetadataWorker(options: RunMetadataWorkerOptions): Promise<void> {
  let nextBacklogMetricsRefreshAt = Number.NEGATIVE_INFINITY;
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
    const observedAt = options.now?.() ?? new Date();
    if (options.metrics != null && observedAt.getTime() >= nextBacklogMetricsRefreshAt) {
      nextBacklogMetricsRefreshAt = observedAt.getTime() + BACKLOG_METRICS_REFRESH_MS;
      try {
        await updateBacklogMetrics(options, observedAt);
      } catch (error) {
        options.logger?.error(
          {
            network: options.runtime.network.key,
            error: error instanceof Error ? error.message : String(error),
          },
          'Metadata backlog metrics refresh failed; job processing will continue',
        );
      }
    }
    if (options.config.runOnce || isAborted(options.signal)) return;
    if (result.claimed === 0) {
      await waitForNextPoll(options.config.pollIntervalMs, options.signal);
    }
  }
}
