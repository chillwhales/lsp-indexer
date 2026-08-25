import { describe, expect, it } from 'vitest';
import {
  loadSoakConfig,
  parsePrometheusText,
  runSoakObservation,
  type SoakConfig,
  type SoakDependencies,
} from '../soak.js';

function metrics(network: string, seconds: number, multiplier: number): string {
  return `
# HELP fixture acceptance fixture
lsp_indexer_database_up{network="${network}",chain_id="42"} 1
lsp_indexer_indexed_block{network="${network}",chain_id="42"} ${seconds * multiplier}
lsp_indexer_block_to_commit_lag_seconds{network="${network}",chain_id="42"} 10
lsp_indexer_cursor_drift_blocks{network="${network}",chain_id="42"} 0
sqd_blocks_processed_total{id="evm:42"} ${seconds * multiplier}
sqd_fallback_source_health{id="evm:42",source="rpc",state="healthy",check="",reason="",code=""} 1
sqd_fallback_chain_stalled{id="evm:42"} 0
sqd_fallback_lag_blocks{id="evm:42"} 1
process_resident_memory_bytes 100000000
process_cpu_seconds_total ${seconds * 0.5}
`;
}

function metadataMetrics(network: string, seconds: number): string {
  return `
lsp_indexer_metadata_oldest_age_seconds{network="${network}",status="pending"} 20
process_resident_memory_bytes 50000000
process_cpu_seconds_total ${seconds * 0.25}
`;
}

function createConfig(): SoakConfig {
  return {
    targets: [
      {
        network: 'lukso-mainnet',
        metricsUrl: 'https://metrics.example.test/lukso',
        metadataMetricsUrl: 'https://metadata.example.test/lukso',
        minimumBlocksPerSecond: 0.5,
        maximumLagSeconds: 120,
        maximumSourceLagBlocks: 10,
        maximumMetadataAgeSeconds: 900,
        maximumResidentMemoryBytes: 200_000_000,
        maximumCpuCores: 1,
        requireFallback: true,
      },
      {
        network: 'ethereum-mainnet',
        metricsUrl: 'https://metrics.example.test/ethereum',
        metadataMetricsUrl: 'https://metadata.example.test/ethereum',
        minimumBlocksPerSecond: 1.5,
        maximumLagSeconds: 120,
        maximumSourceLagBlocks: 10,
        maximumMetadataAgeSeconds: 900,
        maximumResidentMemoryBytes: 200_000_000,
        maximumCpuCores: 1,
        requireFallback: true,
      },
    ],
    durationSeconds: 60,
    minimumEvidenceSeconds: 60,
    intervalSeconds: 30,
    requestTimeoutMs: 1_000,
    maximumScrapeFailures: 0,
  };
}

function rawTarget(network: string): Record<string, unknown> {
  return {
    network,
    metricsUrl: `https://metrics.example.test/${network}`,
    minimumBlocksPerSecond: 1,
    maximumLagSeconds: 120,
    maximumSourceLagBlocks: 10,
    maximumMetadataAgeSeconds: 900,
    maximumResidentMemoryBytes: 1_000_000_000,
    maximumCpuCores: 2,
  };
}

function createDependencies(): SoakDependencies {
  let now = 0;
  return {
    now(): number {
      return now;
    },
    sleep(milliseconds): Promise<void> {
      now += milliseconds;
      return Promise.resolve();
    },
    fetchText(url): Promise<string> {
      const network = url.includes('lukso') ? 'lukso-mainnet' : 'ethereum-mainnet';
      if (url.includes('metadata')) return Promise.resolve(metadataMetrics(network, now / 1_000));
      return Promise.resolve(metrics(network, now / 1_000, network === 'lukso-mainnet' ? 1 : 2));
    },
  };
}

describe('multi-network soak acceptance', () => {
  it('parses escaped labels and finite samples', () => {
    expect(
      parsePrometheusText(
        'metric_name{network="lukso-mainnet",reason="line\\nquote\\""} 2\nignored NaN\n',
      ),
    ).toEqual([
      {
        name: 'metric_name',
        labels: { network: 'lukso-mainnet', reason: 'line\nquote"' },
        value: 2,
      },
    ]);
    expect(parsePrometheusText('# comment\nmetric_without_labels 1 123\n')).toEqual([
      { name: 'metric_without_labels', labels: {}, value: 1 },
    ]);
    expect(() => parsePrometheusText('not a prometheus sample')).toThrow(
      'Invalid Prometheus sample',
    );
    expect(() => parsePrometheusText('metric{broken} 1')).toThrow('Invalid Prometheus labels');
  });

  it('requires distinct configuration for at least two networks', () => {
    expect(() =>
      loadSoakConfig({
        ACCEPTANCE_METRICS_TARGETS: JSON.stringify([
          {
            network: 'lukso-mainnet',
            metricsUrl: 'https://metrics.example.test/lukso',
            minimumBlocksPerSecond: 1,
            maximumLagSeconds: 120,
            maximumSourceLagBlocks: 10,
            maximumMetadataAgeSeconds: 900,
            maximumResidentMemoryBytes: 1_000_000_000,
          },
        ]),
      }),
    ).toThrow('must contain at least two networks');
  });

  it('loads complete budgets and validates malformed acceptance configuration', () => {
    const targets = [rawTarget('lukso-mainnet'), rawTarget('ethereum-mainnet')];
    expect(
      loadSoakConfig({
        ACCEPTANCE_METRICS_TARGETS: JSON.stringify([
          { ...targets[0], requireFallback: false },
          { ...targets[1], metadataMetricsUrl: 'https://metadata.example.test/ethereum' },
        ]),
        ACCEPTANCE_OBSERVATION_SECONDS: '120',
        ACCEPTANCE_MINIMUM_EVIDENCE_SECONDS: '60',
        ACCEPTANCE_SCRAPE_INTERVAL_SECONDS: '30',
        ACCEPTANCE_REQUEST_TIMEOUT_MS: '5000',
        ACCEPTANCE_MAXIMUM_SCRAPE_FAILURES: '2',
      }),
    ).toMatchObject({
      durationSeconds: 120,
      minimumEvidenceSeconds: 60,
      intervalSeconds: 30,
      requestTimeoutMs: 5_000,
      maximumScrapeFailures: 2,
      targets: [
        expect.objectContaining({ network: 'lukso-mainnet', requireFallback: false }),
        expect.objectContaining({
          network: 'ethereum-mainnet',
          metadataMetricsUrl: 'https://metadata.example.test/ethereum',
        }),
      ],
    });

    const invalidCases: Array<[NodeJS.ProcessEnv, string]> = [
      [{}, 'ACCEPTANCE_METRICS_TARGETS is required'],
      [{ ACCEPTANCE_METRICS_TARGETS: '[' }, 'must be valid JSON'],
      [{ ACCEPTANCE_METRICS_TARGETS: '{}' }, 'must contain at least two networks'],
      [
        { ACCEPTANCE_METRICS_TARGETS: JSON.stringify([targets[0], targets[0]]) },
        'contains duplicate networks',
      ],
      [{ ACCEPTANCE_METRICS_TARGETS: JSON.stringify([null, targets[1]]) }, 'must be an object'],
      [
        {
          ACCEPTANCE_METRICS_TARGETS: JSON.stringify([{ ...targets[0], network: '' }, targets[1]]),
        },
        'network is required',
      ],
      [
        {
          ACCEPTANCE_METRICS_TARGETS: JSON.stringify([
            { ...targets[0], metricsUrl: 'bad' },
            targets[1],
          ]),
        },
        'must be an absolute HTTP(S) URL',
      ],
      [
        {
          ACCEPTANCE_METRICS_TARGETS: JSON.stringify([
            { ...targets[0], metricsUrl: 'ftp://example.test' },
            targets[1],
          ]),
        },
        'must use HTTP or HTTPS',
      ],
      [
        {
          ACCEPTANCE_METRICS_TARGETS: JSON.stringify([
            { ...targets[0], metricsUrl: 'https://user:secret@example.test' },
            targets[1],
          ]),
        },
        'must not contain credentials',
      ],
      [
        {
          ACCEPTANCE_METRICS_TARGETS: JSON.stringify([
            { ...targets[0], minimumBlocksPerSecond: '1' },
            targets[1],
          ]),
        },
        'must be a finite number',
      ],
      [
        {
          ACCEPTANCE_METRICS_TARGETS: JSON.stringify(targets),
          ACCEPTANCE_OBSERVATION_SECONDS: '0',
        },
        'must be a safe integer',
      ],
      [
        {
          ACCEPTANCE_METRICS_TARGETS: JSON.stringify(targets),
          ACCEPTANCE_OBSERVATION_SECONDS: '60',
          ACCEPTANCE_SCRAPE_INTERVAL_SECONDS: '61',
        },
        'cannot exceed the observation duration',
      ],
    ];
    for (const [env, message] of invalidCases) {
      expect(() => loadSoakConfig(env)).toThrow(message);
    }
  });

  it('measures independent network throughput, health, lag, metadata, memory, and CPU', async () => {
    const report = await runSoakObservation(createConfig(), createDependencies());

    expect(report.passed).toBe(true);
    expect(report.evidenceLevel).toBe('probe');
    expect(report.targets).toEqual([
      expect.objectContaining({
        network: 'lukso-mainnet',
        samples: 3,
        observedSeconds: 60,
        blocksPerSecond: 1,
        processedBlocksPerSecond: 1,
        sourceLagMaximumBlocks: 1,
        residentMemoryMaximumBytes: 150_000_000,
        cpuCoresP95: 0.75,
        passed: true,
      }),
      expect.objectContaining({
        network: 'ethereum-mainnet',
        samples: 3,
        observedSeconds: 60,
        blocksPerSecond: 2,
        processedBlocksPerSecond: 2,
        passed: true,
      }),
    ]);
  });

  it('fails only the network whose endpoint cannot be scraped', async () => {
    const dependencies = createDependencies();
    const fetchText = dependencies.fetchText;
    dependencies.fetchText = async (url, timeoutMs): Promise<string> => {
      if (url.includes('ethereum')) throw new Error('quota exhausted');
      return fetchText(url, timeoutMs);
    };

    const report = await runSoakObservation(createConfig(), dependencies);

    expect(report.passed).toBe(false);
    expect(report.targets.find(({ network }) => network === 'lukso-mainnet')?.passed).toBe(true);
    expect(report.targets.find(({ network }) => network === 'ethereum-mainnet')).toMatchObject({
      samples: 0,
      scrapeFailures: 3,
      scrapeErrorMessages: ['quota exhausted'],
      passed: false,
    });
  });

  it('fails closed when a configured metadata endpoint omits its required metric', async () => {
    const dependencies = createDependencies();
    const fetchText = dependencies.fetchText;
    dependencies.fetchText = async (url, timeoutMs): Promise<string> => {
      if (url.includes('metadata') && url.includes('lukso')) return 'unrelated_metric 1\n';
      return fetchText(url, timeoutMs);
    };

    const report = await runSoakObservation(createConfig(), dependencies);
    const lukso = report.targets.find(({ network }) => network === 'lukso-mainnet');

    expect(lukso).toMatchObject({
      samples: 0,
      scrapeFailures: 3,
      scrapeErrorMessages: ['Required metric lsp_indexer_metadata_oldest_age_seconds is absent'],
      passed: false,
    });
  });

  it('reports every violated health and resource budget from committed evidence', async () => {
    const baseConfig = createConfig();
    const firstTarget = baseConfig.targets[0];
    if (firstTarget == null) throw new Error('fixture target is missing');
    const config: SoakConfig = {
      ...baseConfig,
      targets: [
        { ...firstTarget, minimumBlocksPerSecond: 2, maximumCpuCores: 0.25 },
        ...baseConfig.targets.slice(1),
      ],
    };
    const dependencies = createDependencies();
    const fetchText = dependencies.fetchText;
    dependencies.fetchText = async (url, timeoutMs): Promise<string> => {
      const body = await fetchText(url, timeoutMs);
      if (!url.includes('lukso')) return body;
      if (url.includes('metadata')) return body.replace(' 20', ' 901');
      return body
        .replace(
          'lsp_indexer_database_up{network="lukso-mainnet",chain_id="42"} 1',
          'lsp_indexer_database_up{network="lukso-mainnet",chain_id="42"} 0',
        )
        .replace(
          'lsp_indexer_block_to_commit_lag_seconds{network="lukso-mainnet",chain_id="42"} 10',
          'lsp_indexer_block_to_commit_lag_seconds{network="lukso-mainnet",chain_id="42"} 121',
        )
        .replace(
          'lsp_indexer_cursor_drift_blocks{network="lukso-mainnet",chain_id="42"} 0',
          'lsp_indexer_cursor_drift_blocks{network="lukso-mainnet",chain_id="42"} 1',
        )
        .replace(
          'sqd_fallback_source_health{id="evm:42",source="rpc",state="healthy",check="",reason="",code=""} 1',
          'sqd_fallback_source_health{id="evm:42",source="rpc",state="healthy",check="",reason="",code=""} 0',
        )
        .replace(
          'sqd_fallback_chain_stalled{id="evm:42"} 0',
          'sqd_fallback_chain_stalled{id="evm:42"} 1',
        )
        .replace(
          'sqd_fallback_lag_blocks{id="evm:42"} 1',
          'sqd_fallback_lag_blocks{id="evm:42"} 11',
        )
        .replace(
          'process_resident_memory_bytes 100000000',
          'process_resident_memory_bytes 200000001',
        );
    };

    const report = await runSoakObservation(config, dependencies);
    const lukso = report.targets.find(({ network }) => network === 'lukso-mainnet');

    expect(lukso).toMatchObject({
      databaseHealthy: false,
      fallbackHealthy: false,
      sourceLagMaximumBlocks: 11,
      cursorDriftMaximum: 1,
      metadataOldestAgeMaximumSeconds: 901,
      residentMemoryMaximumBytes: 250_000_001,
      passed: false,
    });
    expect(lukso?.failures).toEqual(
      expect.arrayContaining([
        expect.stringContaining('database health'),
        expect.stringContaining('fallback health'),
        expect.stringContaining('source lag'),
        expect.stringContaining('blocks/s'),
        expect.stringContaining('p95 commit lag'),
        expect.stringContaining('cursor drift'),
        expect.stringContaining('metadata age'),
        expect.stringContaining('resident bytes'),
        expect.stringContaining('p95 CPU cores'),
      ]),
    );
  });

  it('supports non-fallback targets without metadata and labels full-duration evidence', async () => {
    const config = createConfig();
    config.durationSeconds = 86_400;
    config.minimumEvidenceSeconds = 86_400;
    config.intervalSeconds = 86_400;
    config.targets = config.targets.map((target) => ({
      network: target.network,
      metricsUrl: target.metricsUrl,
      minimumBlocksPerSecond: target.minimumBlocksPerSecond,
      maximumLagSeconds: target.maximumLagSeconds,
      maximumSourceLagBlocks: target.maximumSourceLagBlocks,
      maximumMetadataAgeSeconds: target.maximumMetadataAgeSeconds,
      maximumResidentMemoryBytes: target.maximumResidentMemoryBytes,
      maximumCpuCores: target.maximumCpuCores,
      requireFallback: false,
    }));

    const report = await runSoakObservation(config, createDependencies());

    expect(report.evidenceLevel).toBe('production-soak');
    expect(report.targets.every(({ fallbackHealthy }) => fallbackHealthy)).toBe(true);
    expect(
      report.targets.every(
        ({ metadataOldestAgeMaximumSeconds }) => metadataOldestAgeMaximumSeconds == null,
      ),
    ).toBe(true);
  });
});
