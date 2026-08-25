import type { Gauge, GaugeConfiguration, MetricsServer } from '@subsquid/pipes';
import { describe, expect, it, vi } from 'vitest';
import { loadRuntimeConfig } from '../../config/index.js';
import { registerIndexerDatabaseMetrics, type IndexerDatabaseMetricsReader } from '../metrics.js';

interface RegisteredGauge {
  name: string;
  values: Array<{ labels: Partial<Record<string, string | number>>; value: number }>;
  collect(): Promise<void>;
}

function createMetrics(): { metrics: MetricsServer['metrics']; gauges: RegisteredGauge[] } {
  const gauges: RegisteredGauge[] = [];
  const metrics: MetricsServer['metrics'] = {
    counter(): never {
      throw new Error('counter not expected');
    },
    histogram(): never {
      throw new Error('histogram not expected');
    },
    summary(): never {
      throw new Error('summary not expected');
    },
    gauge<T extends string>(options: GaugeConfiguration<T>): Gauge<T> {
      const values: RegisteredGauge['values'] = [];
      const gauge = {
        name: options.name,
        values,
        reset(): void {
          values.length = 0;
        },
        set(labelsOrValue: number | Partial<Record<T, string | number>>, value?: number): void {
          if (typeof labelsOrValue === 'number') {
            values.push({ labels: {}, value: labelsOrValue });
            return;
          }
          values.push({ labels: labelsOrValue, value: value ?? 0 });
        },
        async collect(): Promise<void> {
          await options.collect?.call(gauge);
        },
      };
      gauges.push(gauge);
      return gauge;
    },
  };
  return { metrics, gauges };
}

describe('indexer database metrics', () => {
  it('exports committed head, cursor, finality, and lag for one network', async () => {
    const runtime = loadRuntimeConfig({ INDEXER_NETWORK: 'lukso-mainnet' });
    const reader: IndexerDatabaseMetricsReader = {
      read: vi.fn(() =>
        Promise.resolve({
          indexedBlock: 1_100,
          finalizedBlock: 1_075,
          cursorBlock: 1_100,
          blockTimestamp: new Date(1_999_970_000),
        }),
      ),
    };
    const { metrics, gauges } = createMetrics();

    registerIndexerDatabaseMetrics(metrics, runtime, reader, () => 2_000_000_000);
    await Promise.all(gauges.map(({ collect }) => collect()));

    expect(gauges.map(({ name }) => name)).toEqual([
      'lsp_indexer_database_up',
      'lsp_indexer_indexed_block',
      'lsp_indexer_finalized_block',
      'lsp_indexer_cursor_block',
      'lsp_indexer_block_to_commit_lag_seconds',
      'lsp_indexer_finality_depth_blocks',
      'lsp_indexer_cursor_drift_blocks',
    ]);
    expect(gauges.map(({ values }) => values[0]?.value)).toEqual([
      1, 1_100, 1_075, 1_100, 30, 25, 0,
    ]);
    expect(reader.read).toHaveBeenCalledOnce();
    expect(gauges[0]?.values[0]?.labels).toEqual({ network: 'lukso-mainnet', chain_id: '42' });
  });

  it('marks PostgreSQL unavailable and suppresses stale committed values', async () => {
    const runtime = loadRuntimeConfig({ INDEXER_NETWORK: 'ethereum-mainnet' });
    const reader: IndexerDatabaseMetricsReader = {
      read: vi.fn(() => Promise.reject(new Error('database unavailable'))),
    };
    const { metrics, gauges } = createMetrics();

    registerIndexerDatabaseMetrics(metrics, runtime, reader, () => 2_000_000_000);
    await Promise.all(gauges.map(({ collect }) => collect()));

    expect(gauges[0]?.values[0]?.value).toBe(0);
    expect(gauges.slice(1).every(({ values }) => values.length === 0)).toBe(true);
  });
});
