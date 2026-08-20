import type { Counter, Gauge, Histogram, MetricsServer } from '@subsquid/pipes';

export interface MetadataMetrics {
  claimed: Counter<'network' | 'kind'>;
  completed: Counter<'network' | 'kind' | 'outcome'>;
  retries: Counter<'network' | 'kind'>;
  backlog: Gauge<'network' | 'status'>;
  fetchDuration: Histogram<'network' | 'kind'>;
  queueLatency: Histogram<'network' | 'kind'>;
  responseBytes: Histogram<'network' | 'kind'>;
}

/** Register the metadata lifecycle metrics once on a Pipes metrics registry. */
export function registerMetadataMetrics(metrics: MetricsServer['metrics']): MetadataMetrics {
  return {
    claimed: metrics.counter({
      name: 'lsp_indexer_metadata_jobs_claimed_total',
      help: 'Finalized metadata jobs claimed for processing.',
      labelNames: ['network', 'kind'] as const,
    }),
    completed: metrics.counter({
      name: 'lsp_indexer_metadata_jobs_completed_total',
      help: 'Metadata job settlements by terminal or retry outcome.',
      labelNames: ['network', 'kind', 'outcome'] as const,
    }),
    retries: metrics.counter({
      name: 'lsp_indexer_metadata_retries_total',
      help: 'Retryable metadata failures scheduled for another attempt.',
      labelNames: ['network', 'kind'] as const,
    }),
    backlog: metrics.gauge({
      name: 'lsp_indexer_metadata_jobs',
      help: 'Current metadata job rows by lifecycle status.',
      labelNames: ['network', 'status'] as const,
    }),
    fetchDuration: metrics.histogram({
      name: 'lsp_indexer_metadata_fetch_duration_seconds',
      help: 'External metadata request, verification, and parsing latency.',
      labelNames: ['network', 'kind'] as const,
      buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 20, 60],
    }),
    queueLatency: metrics.histogram({
      name: 'lsp_indexer_metadata_queue_latency_seconds',
      help: 'Time from durable job creation to the current claim.',
      labelNames: ['network', 'kind'] as const,
      buckets: [0.1, 1, 5, 15, 60, 300, 1_800, 7_200, 86_400],
    }),
    responseBytes: metrics.histogram({
      name: 'lsp_indexer_metadata_response_bytes',
      help: 'Validated metadata response size in bytes.',
      labelNames: ['network', 'kind'] as const,
      buckets: [1_024, 4_096, 16_384, 65_536, 262_144, 1_048_576, 4_194_304],
    }),
  };
}
