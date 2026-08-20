import type { MetricsServer } from '@subsquid/pipes';
import { describe, expect, it, vi } from 'vitest';
import { registerMetadataMetrics } from '../metrics.js';

describe('metadata metrics', () => {
  it('registers the complete lifecycle metric surface', () => {
    const counter = vi.fn(({ name }: { name: string }) => ({ name }));
    const gauge = vi.fn(({ name }: { name: string }) => ({ name }));
    const histogram = vi.fn(({ name }: { name: string }) => ({ name }));
    const registry = { counter, gauge, histogram };

    const metrics = registerMetadataMetrics(
      registry as unknown as MetricsServer['metrics'],
    ) as unknown as Record<string, { name: string }>;

    expect(Object.values(metrics).map(({ name }) => name)).toEqual([
      'lsp_indexer_metadata_jobs_claimed_total',
      'lsp_indexer_metadata_jobs_completed_total',
      'lsp_indexer_metadata_retries_total',
      'lsp_indexer_metadata_jobs',
      'lsp_indexer_metadata_fetch_duration_seconds',
      'lsp_indexer_metadata_queue_latency_seconds',
      'lsp_indexer_metadata_response_bytes',
    ]);
    expect(counter).toHaveBeenCalledTimes(3);
    expect(gauge).toHaveBeenCalledOnce();
    expect(histogram).toHaveBeenCalledTimes(3);
  });
});
