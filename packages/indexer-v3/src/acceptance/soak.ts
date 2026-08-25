import { PRODUCTION_SOAK_SECONDS, type SoakConfig, type SoakTarget } from './soak-config.js';
import {
  optionalMaximum,
  parsePrometheusText,
  requiredMaximum,
  values,
  type PrometheusSample,
} from './soak-metrics.js';

export { loadSoakConfig, type SoakConfig, type SoakTarget } from './soak-config.js';
export { parsePrometheusText, type PrometheusSample } from './soak-metrics.js';

interface RuntimeSample {
  observedAt: number;
  databaseUp: number;
  lagSeconds: number;
  cursorDrift: number;
  indexedBlock: number;
  processedBlocks: number;
  fallbackHealthySources: number | null;
  fallbackStalled: number | null;
  fallbackLagBlocks: number | null;
  metadataOldestAgeSeconds: number | null;
  residentMemoryBytes: number;
  indexerCpuSeconds: number;
  metadataCpuSeconds: number;
}

export interface SoakTargetReport {
  network: string;
  samples: number;
  scrapeFailures: number;
  scrapeErrorMessages: string[];
  observedSeconds: number;
  blocksPerSecond: number;
  processedBlocksPerSecond: number;
  lagP95Seconds: number;
  sourceLagMaximumBlocks: number | null;
  cursorDriftMaximum: number;
  metadataOldestAgeMaximumSeconds: number | null;
  residentMemoryMaximumBytes: number;
  cpuCoresP95: number;
  databaseHealthy: boolean;
  fallbackHealthy: boolean;
  failures: string[];
  passed: boolean;
}

export interface SoakReport {
  generatedAt: string;
  configuredDurationSeconds: number;
  minimumEvidenceSeconds: number;
  evidenceLevel: 'probe' | 'production-soak';
  targets: SoakTargetReport[];
  passed: boolean;
}

export interface SoakDependencies {
  now(): number;
  sleep(milliseconds: number): Promise<void>;
  fetchText(url: string, timeoutMs: number): Promise<string>;
}

async function defaultFetchText(url: string, timeoutMs: number): Promise<string> {
  const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) throw new Error(`Metrics endpoint returned HTTP ${response.status}`);
  return response.text();
}

const DEFAULT_DEPENDENCIES: SoakDependencies = {
  now: Date.now,
  sleep(milliseconds): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  },
  fetchText: defaultFetchText,
};

interface MetadataMetrics {
  oldestAgeSeconds: number | null;
  residentMemoryBytes: number;
  cpuSeconds: number;
}

function readMetadataMetrics(
  target: SoakTarget,
  samples: readonly PrometheusSample[],
): MetadataMetrics {
  if (target.metadataMetricsUrl == null) {
    return { oldestAgeSeconds: null, residentMemoryBytes: 0, cpuSeconds: 0 };
  }
  const ages = [
    ...values(samples, 'lsp_indexer_metadata_oldest_age_seconds', {
      network: target.network,
      status: 'pending',
    }),
    ...values(samples, 'lsp_indexer_metadata_oldest_age_seconds', {
      network: target.network,
      status: 'retry',
    }),
  ];
  if (ages.length === 0) {
    throw new Error('Required metric lsp_indexer_metadata_oldest_age_seconds is absent');
  }
  return {
    oldestAgeSeconds: Math.max(0, ...ages),
    residentMemoryBytes: requiredMaximum(samples, 'process_resident_memory_bytes', {}),
    cpuSeconds: requiredMaximum(samples, 'process_cpu_seconds_total', {}),
  };
}

async function scrapeTarget(
  target: SoakTarget,
  config: SoakConfig,
  dependencies: SoakDependencies,
): Promise<RuntimeSample> {
  const [indexerText, metadataText] = await Promise.all([
    dependencies.fetchText(target.metricsUrl, config.requestTimeoutMs),
    target.metadataMetricsUrl == null
      ? Promise.resolve<string | null>(null)
      : dependencies.fetchText(target.metadataMetricsUrl, config.requestTimeoutMs),
  ]);
  const indexer = parsePrometheusText(indexerText);
  const metadata = metadataText == null ? [] : parsePrometheusText(metadataText);
  const network = { network: target.network };
  const healthySources = values(indexer, 'sqd_fallback_source_health', {
    state: 'healthy',
  }).filter((value) => value === 1).length;
  const fallbackStalled = optionalMaximum(indexer, 'sqd_fallback_chain_stalled', {});
  const metadataMetrics = readMetadataMetrics(target, metadata);
  return {
    observedAt: dependencies.now(),
    databaseUp: requiredMaximum(indexer, 'lsp_indexer_database_up', network),
    lagSeconds: requiredMaximum(indexer, 'lsp_indexer_block_to_commit_lag_seconds', network),
    cursorDrift: requiredMaximum(indexer, 'lsp_indexer_cursor_drift_blocks', network),
    indexedBlock: requiredMaximum(indexer, 'lsp_indexer_indexed_block', network),
    processedBlocks: requiredMaximum(indexer, 'sqd_blocks_processed_total', {}),
    fallbackHealthySources: fallbackStalled == null && healthySources === 0 ? null : healthySources,
    fallbackStalled,
    fallbackLagBlocks: optionalMaximum(indexer, 'sqd_fallback_lag_blocks', {}),
    metadataOldestAgeSeconds: metadataMetrics.oldestAgeSeconds,
    residentMemoryBytes:
      requiredMaximum(indexer, 'process_resident_memory_bytes', {}) +
      metadataMetrics.residentMemoryBytes,
    indexerCpuSeconds: requiredMaximum(indexer, 'process_cpu_seconds_total', {}),
    metadataCpuSeconds: metadataMetrics.cpuSeconds,
  };
}

function percentile(values: readonly number[], ratio: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.max(0, Math.ceil(sorted.length * ratio) - 1);
  return sorted[index] ?? 0;
}

function counterRate(
  samples: readonly RuntimeSample[],
  select: (sample: RuntimeSample) => number,
): number {
  if (samples.length < 2) return 0;
  let delta = 0;
  for (let index = 1; index < samples.length; index += 1) {
    const previousSample = samples[index - 1];
    const currentSample = samples[index];
    if (previousSample == null || currentSample == null) continue;
    const previous = select(previousSample);
    const current = select(currentSample);
    delta += current >= previous ? current - previous : current;
  }
  const elapsed = ((samples.at(-1)?.observedAt ?? 0) - (samples[0]?.observedAt ?? 0)) / 1_000;
  return elapsed <= 0 ? 0 : delta / elapsed;
}

function committedBlockRate(samples: readonly RuntimeSample[]): number {
  if (samples.length < 2) return 0;
  const first = samples[0];
  const last = samples.at(-1);
  if (first == null || last == null) return 0;
  const elapsed = (last.observedAt - first.observedAt) / 1_000;
  return elapsed <= 0 ? 0 : Math.max(0, last.indexedBlock - first.indexedBlock) / elapsed;
}

function cpuRates(samples: readonly RuntimeSample[]): number[] {
  const rates: number[] = [];
  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1];
    const current = samples[index];
    if (previous == null || current == null) continue;
    const elapsed = (current.observedAt - previous.observedAt) / 1_000;
    if (elapsed <= 0) continue;
    const indexerDelta =
      current.indexerCpuSeconds >= previous.indexerCpuSeconds
        ? current.indexerCpuSeconds - previous.indexerCpuSeconds
        : current.indexerCpuSeconds;
    const metadataDelta =
      current.metadataCpuSeconds >= previous.metadataCpuSeconds
        ? current.metadataCpuSeconds - previous.metadataCpuSeconds
        : current.metadataCpuSeconds;
    rates.push((indexerDelta + metadataDelta) / elapsed);
  }
  return rates;
}

interface TargetMeasurements {
  observedSeconds: number;
  blocksPerSecond: number;
  processedBlocksPerSecond: number;
  lagP95Seconds: number;
  sourceLagMaximumBlocks: number | null;
  sourceLagSamples: number;
  cursorDriftMaximum: number;
  metadataOldestAgeMaximumSeconds: number | null;
  residentMemoryMaximumBytes: number;
  cpuCoresP95: number;
  databaseHealthy: boolean;
  fallbackHealthy: boolean;
}

function fallbackHealthy(target: SoakTarget, samples: readonly RuntimeSample[]): boolean {
  if (!target.requireFallback) return true;
  return (
    samples.length > 1 &&
    samples.every(
      ({ fallbackHealthySources, fallbackStalled }) =>
        fallbackHealthySources != null && fallbackHealthySources > 0 && fallbackStalled === 0,
    )
  );
}

function measureTarget(
  target: SoakTarget,
  samples: readonly RuntimeSample[],
  observedWindowSeconds: number,
): TargetMeasurements {
  const sourceLags = samples.flatMap(({ fallbackLagBlocks }) =>
    fallbackLagBlocks == null ? [] : [fallbackLagBlocks],
  );
  const metadataAges = samples.flatMap(({ metadataOldestAgeSeconds }) =>
    metadataOldestAgeSeconds == null ? [] : [metadataOldestAgeSeconds],
  );
  return {
    observedSeconds: observedWindowSeconds,
    blocksPerSecond: committedBlockRate(samples),
    processedBlocksPerSecond: counterRate(samples, ({ processedBlocks }) => processedBlocks),
    lagP95Seconds: percentile(
      samples.map(({ lagSeconds }) => lagSeconds),
      0.95,
    ),
    sourceLagMaximumBlocks: sourceLags.length === 0 ? null : Math.max(...sourceLags),
    sourceLagSamples: sourceLags.length,
    cursorDriftMaximum: Math.max(0, ...samples.map(({ cursorDrift }) => cursorDrift)),
    metadataOldestAgeMaximumSeconds: metadataAges.length === 0 ? null : Math.max(...metadataAges),
    residentMemoryMaximumBytes: Math.max(
      0,
      ...samples.map(({ residentMemoryBytes }) => residentMemoryBytes),
    ),
    cpuCoresP95: percentile(cpuRates(samples), 0.95),
    databaseHealthy: samples.length > 1 && samples.every(({ databaseUp }) => databaseUp === 1),
    fallbackHealthy: fallbackHealthy(target, samples),
  };
}

function evidenceFailures(
  target: SoakTarget,
  sampleCount: number,
  scrapeFailures: number,
  measurements: TargetMeasurements,
  config: SoakConfig,
): string[] {
  const failures: string[] = [];
  if (measurements.observedSeconds < config.minimumEvidenceSeconds) {
    failures.push(
      `observed ${measurements.observedSeconds}s, below the ${config.minimumEvidenceSeconds}s evidence minimum`,
    );
  }
  if (scrapeFailures > config.maximumScrapeFailures) {
    failures.push(
      `${scrapeFailures} scrape failures exceed the ${config.maximumScrapeFailures} failure budget`,
    );
  }
  if (!measurements.databaseHealthy) {
    failures.push('database health was not continuously available');
  }
  if (!measurements.fallbackHealthy) {
    failures.push('fallback health was absent, unhealthy, or stalled');
  }
  if (
    target.requireFallback &&
    (measurements.sourceLagSamples !== sampleCount ||
      measurements.sourceLagMaximumBlocks == null ||
      measurements.sourceLagMaximumBlocks > target.maximumSourceLagBlocks)
  ) {
    failures.push(
      `source lag ${measurements.sourceLagMaximumBlocks ?? 'missing'} exceeds ${target.maximumSourceLagBlocks} blocks or was absent`,
    );
  }
  return failures;
}

function budgetFailures(target: SoakTarget, measurements: TargetMeasurements): string[] {
  const failures: string[] = [];
  if (measurements.blocksPerSecond < target.minimumBlocksPerSecond) {
    failures.push(
      `${measurements.blocksPerSecond} blocks/s is below the ${target.minimumBlocksPerSecond} blocks/s budget`,
    );
  }
  if (measurements.lagP95Seconds > target.maximumLagSeconds) {
    failures.push(
      `${measurements.lagP95Seconds}s p95 commit lag exceeds ${target.maximumLagSeconds}s`,
    );
  }
  if (measurements.cursorDriftMaximum > 0) {
    failures.push(`cursor drift reached ${measurements.cursorDriftMaximum} blocks`);
  }
  if (
    target.metadataMetricsUrl != null &&
    (measurements.metadataOldestAgeMaximumSeconds == null ||
      measurements.metadataOldestAgeMaximumSeconds > target.maximumMetadataAgeSeconds)
  ) {
    failures.push(
      `metadata age ${measurements.metadataOldestAgeMaximumSeconds ?? 'missing'} exceeds ${target.maximumMetadataAgeSeconds}s`,
    );
  }
  if (measurements.residentMemoryMaximumBytes > target.maximumResidentMemoryBytes) {
    failures.push(
      `${measurements.residentMemoryMaximumBytes} resident bytes exceed ${target.maximumResidentMemoryBytes}`,
    );
  }
  if (measurements.cpuCoresP95 > target.maximumCpuCores) {
    failures.push(`${measurements.cpuCoresP95} p95 CPU cores exceed ${target.maximumCpuCores}`);
  }
  return failures;
}

function createTargetReport(
  target: SoakTarget,
  samples: readonly RuntimeSample[],
  scrapeFailures: number,
  scrapeErrorMessages: readonly string[],
  config: SoakConfig,
  observedWindowSeconds: number,
): SoakTargetReport {
  const measurements = measureTarget(target, samples, observedWindowSeconds);
  const failures = [
    ...evidenceFailures(target, samples.length, scrapeFailures, measurements, config),
    ...budgetFailures(target, measurements),
  ];
  return {
    network: target.network,
    samples: samples.length,
    scrapeFailures,
    scrapeErrorMessages: [...scrapeErrorMessages],
    observedSeconds: measurements.observedSeconds,
    blocksPerSecond: measurements.blocksPerSecond,
    processedBlocksPerSecond: measurements.processedBlocksPerSecond,
    lagP95Seconds: measurements.lagP95Seconds,
    sourceLagMaximumBlocks: measurements.sourceLagMaximumBlocks,
    cursorDriftMaximum: measurements.cursorDriftMaximum,
    metadataOldestAgeMaximumSeconds: measurements.metadataOldestAgeMaximumSeconds,
    residentMemoryMaximumBytes: measurements.residentMemoryMaximumBytes,
    cpuCoresP95: measurements.cpuCoresP95,
    databaseHealthy: measurements.databaseHealthy,
    fallbackHealthy: measurements.fallbackHealthy,
    failures,
    passed: failures.length === 0,
  };
}

/** Observe every configured network independently and emit one auditable soak/performance report. */
export async function runSoakObservation(
  config: SoakConfig,
  dependencies: SoakDependencies = DEFAULT_DEPENDENCIES,
): Promise<SoakReport> {
  const samples = new Map(config.targets.map(({ network }) => [network, [] as RuntimeSample[]]));
  const failures = new Map(config.targets.map(({ network }) => [network, 0]));
  const scrapeErrors = new Map(config.targets.map(({ network }) => [network, [] as string[]]));
  const startedAt = dependencies.now();
  const deadline = startedAt + config.durationSeconds * 1_000;

  while (true) {
    await Promise.all(
      config.targets.map(async (target): Promise<void> => {
        try {
          const sample = await scrapeTarget(target, config, dependencies);
          samples.get(target.network)?.push(sample);
        } catch (error: unknown) {
          failures.set(target.network, (failures.get(target.network) ?? 0) + 1);
          const messages = scrapeErrors.get(target.network);
          const message = error instanceof Error ? error.message : String(error);
          if (messages != null && messages.length < 10 && !messages.includes(message)) {
            messages.push(message);
          }
        }
      }),
    );
    const remaining = deadline - dependencies.now();
    if (remaining <= 0) break;
    await dependencies.sleep(Math.min(config.intervalSeconds * 1_000, remaining));
  }

  const observedWindowSeconds = (Math.min(dependencies.now(), deadline) - startedAt) / 1_000;
  const targets = config.targets.map((target) =>
    createTargetReport(
      target,
      samples.get(target.network) ?? [],
      failures.get(target.network) ?? 0,
      scrapeErrors.get(target.network) ?? [],
      config,
      observedWindowSeconds,
    ),
  );
  return {
    generatedAt: new Date(dependencies.now()).toISOString(),
    configuredDurationSeconds: config.durationSeconds,
    minimumEvidenceSeconds: config.minimumEvidenceSeconds,
    evidenceLevel: config.durationSeconds >= PRODUCTION_SOAK_SECONDS ? 'production-soak' : 'probe',
    targets,
    passed: targets.every(({ passed }) => passed),
  };
}
