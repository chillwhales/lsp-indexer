const PRODUCTION_SOAK_SECONDS = 86_400;
const DEFAULT_INTERVAL_SECONDS = 30;
const DEFAULT_TIMEOUT_MS = 10_000;

export interface SoakTarget {
  network: string;
  metricsUrl: string;
  metadataMetricsUrl?: string;
  minimumBlocksPerSecond: number;
  maximumLagSeconds: number;
  maximumSourceLagBlocks: number;
  maximumMetadataAgeSeconds: number;
  maximumResidentMemoryBytes: number;
  maximumCpuCores: number;
  requireFallback: boolean;
}

export interface SoakConfig {
  targets: readonly SoakTarget[];
  durationSeconds: number;
  minimumEvidenceSeconds: number;
  intervalSeconds: number;
  requestTimeoutMs: number;
  maximumScrapeFailures: number;
}

export interface PrometheusSample {
  name: string;
  labels: Readonly<Record<string, string>>;
  value: number;
}

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
  cpuSeconds: number;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null && !Array.isArray(value);
}

function readFiniteNumber(value: unknown, name: string, minimum: number): number {
  const number = typeof value === 'number' ? value : Number.NaN;
  if (!Number.isFinite(number) || number < minimum) {
    throw new Error(`${name} must be a finite number greater than or equal to ${minimum}`);
  }
  return number;
}

function readInteger(
  value: string | undefined,
  name: string,
  fallback: number,
  minimum: number,
): number {
  if (value == null || value.trim() === '') return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum) {
    throw new Error(`${name} must be a safe integer greater than or equal to ${minimum}`);
  }
  return parsed;
}

function readUrl(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`${name} is required`);
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error(`${name} must be an absolute HTTP(S) URL`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`${name} must use HTTP or HTTPS`);
  }
  if (url.username !== '' || url.password !== '') {
    throw new Error(`${name} must not contain credentials`);
  }
  return url.toString();
}

function readTarget(value: unknown, index: number): SoakTarget {
  if (!isRecord(value)) throw new Error(`ACCEPTANCE_METRICS_TARGETS[${index}] must be an object`);
  const network = typeof value.network === 'string' ? value.network.trim() : '';
  if (!network) throw new Error(`ACCEPTANCE_METRICS_TARGETS[${index}].network is required`);
  const metadataMetricsUrl =
    value.metadataMetricsUrl == null
      ? undefined
      : readUrl(
          value.metadataMetricsUrl,
          `ACCEPTANCE_METRICS_TARGETS[${index}].metadataMetricsUrl`,
        );
  return {
    network,
    metricsUrl: readUrl(value.metricsUrl, `ACCEPTANCE_METRICS_TARGETS[${index}].metricsUrl`),
    ...(metadataMetricsUrl == null ? {} : { metadataMetricsUrl }),
    minimumBlocksPerSecond: readFiniteNumber(
      value.minimumBlocksPerSecond,
      `ACCEPTANCE_METRICS_TARGETS[${index}].minimumBlocksPerSecond`,
      0,
    ),
    maximumLagSeconds: readFiniteNumber(
      value.maximumLagSeconds,
      `ACCEPTANCE_METRICS_TARGETS[${index}].maximumLagSeconds`,
      0,
    ),
    maximumSourceLagBlocks: readFiniteNumber(
      value.maximumSourceLagBlocks,
      `ACCEPTANCE_METRICS_TARGETS[${index}].maximumSourceLagBlocks`,
      0,
    ),
    maximumMetadataAgeSeconds: readFiniteNumber(
      value.maximumMetadataAgeSeconds,
      `ACCEPTANCE_METRICS_TARGETS[${index}].maximumMetadataAgeSeconds`,
      0,
    ),
    maximumResidentMemoryBytes: readFiniteNumber(
      value.maximumResidentMemoryBytes,
      `ACCEPTANCE_METRICS_TARGETS[${index}].maximumResidentMemoryBytes`,
      1,
    ),
    maximumCpuCores: readFiniteNumber(
      value.maximumCpuCores,
      `ACCEPTANCE_METRICS_TARGETS[${index}].maximumCpuCores`,
      0,
    ),
    requireFallback: value.requireFallback !== false,
  };
}

/** Load the multi-network metrics observation and performance budgets. */
export function loadSoakConfig(env: NodeJS.ProcessEnv = process.env): SoakConfig {
  if (env.ACCEPTANCE_METRICS_TARGETS == null) {
    throw new Error('ACCEPTANCE_METRICS_TARGETS is required');
  }
  let rawTargets: unknown;
  try {
    rawTargets = JSON.parse(env.ACCEPTANCE_METRICS_TARGETS);
  } catch {
    throw new Error('ACCEPTANCE_METRICS_TARGETS must be valid JSON');
  }
  if (!Array.isArray(rawTargets) || rawTargets.length < 2) {
    throw new Error('ACCEPTANCE_METRICS_TARGETS must contain at least two networks');
  }
  const targets = rawTargets.map(readTarget);
  if (new Set(targets.map(({ network }) => network)).size !== targets.length) {
    throw new Error('ACCEPTANCE_METRICS_TARGETS contains duplicate networks');
  }
  const durationSeconds = readInteger(
    env.ACCEPTANCE_OBSERVATION_SECONDS,
    'ACCEPTANCE_OBSERVATION_SECONDS',
    PRODUCTION_SOAK_SECONDS,
    1,
  );
  const intervalSeconds = readInteger(
    env.ACCEPTANCE_SCRAPE_INTERVAL_SECONDS,
    'ACCEPTANCE_SCRAPE_INTERVAL_SECONDS',
    DEFAULT_INTERVAL_SECONDS,
    1,
  );
  if (intervalSeconds > durationSeconds) {
    throw new Error('ACCEPTANCE_SCRAPE_INTERVAL_SECONDS cannot exceed the observation duration');
  }
  return {
    targets,
    durationSeconds,
    minimumEvidenceSeconds: readInteger(
      env.ACCEPTANCE_MINIMUM_EVIDENCE_SECONDS,
      'ACCEPTANCE_MINIMUM_EVIDENCE_SECONDS',
      PRODUCTION_SOAK_SECONDS,
      1,
    ),
    intervalSeconds,
    requestTimeoutMs: readInteger(
      env.ACCEPTANCE_REQUEST_TIMEOUT_MS,
      'ACCEPTANCE_REQUEST_TIMEOUT_MS',
      DEFAULT_TIMEOUT_MS,
      1,
    ),
    maximumScrapeFailures: readInteger(
      env.ACCEPTANCE_MAXIMUM_SCRAPE_FAILURES,
      'ACCEPTANCE_MAXIMUM_SCRAPE_FAILURES',
      0,
      0,
    ),
  };
}

function unescapeLabel(value: string): string {
  return value.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
}

function parseLabels(value: string | undefined): Record<string, string> {
  if (value == null || value === '') return {};
  const labels: Record<string, string> = {};
  const expression = /([A-Za-z_][A-Za-z0-9_]*)="((?:\\.|[^"\\])*)"(?:,|$)/gy;
  let offset = 0;
  while (offset < value.length) {
    expression.lastIndex = offset;
    const match = expression.exec(value);
    if (match == null || match.index !== offset || match[1] == null || match[2] == null) {
      throw new Error(`Invalid Prometheus labels: ${value}`);
    }
    labels[match[1]] = unescapeLabel(match[2]);
    offset = expression.lastIndex;
  }
  return labels;
}

/** Parse the Prometheus text samples needed by the v3 acceptance observer. */
export function parsePrometheusText(text: string): PrometheusSample[] {
  const samples: PrometheusSample[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === '' || line.startsWith('#')) continue;
    const match = /^([A-Za-z_:][A-Za-z0-9_:]*)(?:\{(.*)\})?\s+([^\s]+)(?:\s+\d+)?$/.exec(line);
    if (match == null || match[1] == null || match[3] == null) {
      throw new Error(`Invalid Prometheus sample: ${line}`);
    }
    const value = Number(match[3]);
    if (!Number.isFinite(value)) continue;
    samples.push({ name: match[1], labels: parseLabels(match[2]), value });
  }
  return samples;
}

function values(
  samples: readonly PrometheusSample[],
  name: string,
  labels: Readonly<Record<string, string>> = {},
): number[] {
  return samples
    .filter(
      (sample) =>
        sample.name === name &&
        Object.entries(labels).every(([key, value]) => sample.labels[key] === value),
    )
    .map(({ value }) => value);
}

function requiredMaximum(
  samples: readonly PrometheusSample[],
  metric: string,
  labels: Readonly<Record<string, string>>,
): number {
  const matches = values(samples, metric, labels);
  if (matches.length === 0) throw new Error(`Required metric ${metric} is absent`);
  return Math.max(...matches);
}

function optionalMaximum(
  samples: readonly PrometheusSample[],
  metric: string,
  labels: Readonly<Record<string, string>>,
): number | null {
  const matches = values(samples, metric, labels);
  return matches.length === 0 ? null : Math.max(...matches);
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
  const metadataAges = [
    ...values(metadata, 'lsp_indexer_metadata_oldest_age_seconds', {
      network: target.network,
      status: 'pending',
    }),
    ...values(metadata, 'lsp_indexer_metadata_oldest_age_seconds', {
      network: target.network,
      status: 'retry',
    }),
  ];
  if (target.metadataMetricsUrl != null && metadataAges.length === 0) {
    throw new Error('Required metric lsp_indexer_metadata_oldest_age_seconds is absent');
  }
  const metadataResidentMemoryBytes =
    target.metadataMetricsUrl == null
      ? 0
      : requiredMaximum(metadata, 'process_resident_memory_bytes', {});
  const metadataCpuSeconds =
    target.metadataMetricsUrl == null
      ? 0
      : requiredMaximum(metadata, 'process_cpu_seconds_total', {});
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
    metadataOldestAgeSeconds:
      target.metadataMetricsUrl == null ? null : Math.max(0, ...metadataAges),
    residentMemoryBytes:
      requiredMaximum(indexer, 'process_resident_memory_bytes', {}) + metadataResidentMemoryBytes,
    cpuSeconds: requiredMaximum(indexer, 'process_cpu_seconds_total', {}) + metadataCpuSeconds,
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
    const delta =
      current.cpuSeconds >= previous.cpuSeconds
        ? current.cpuSeconds - previous.cpuSeconds
        : current.cpuSeconds;
    rates.push(delta / elapsed);
  }
  return rates;
}

function createTargetReport(
  target: SoakTarget,
  samples: readonly RuntimeSample[],
  scrapeFailures: number,
  scrapeErrorMessages: readonly string[],
  config: SoakConfig,
): SoakTargetReport {
  const observedSeconds =
    samples.length < 2
      ? 0
      : ((samples.at(-1)?.observedAt ?? 0) - (samples[0]?.observedAt ?? 0)) / 1_000;
  const blocksPerSecond = committedBlockRate(samples);
  const processedBlocksPerSecond = counterRate(samples, ({ processedBlocks }) => processedBlocks);
  const lagP95Seconds = percentile(
    samples.map(({ lagSeconds }) => lagSeconds),
    0.95,
  );
  const cursorDriftMaximum = Math.max(0, ...samples.map(({ cursorDrift }) => cursorDrift));
  const sourceLags = samples.flatMap(({ fallbackLagBlocks }) =>
    fallbackLagBlocks == null ? [] : [fallbackLagBlocks],
  );
  const sourceLagMaximumBlocks = sourceLags.length === 0 ? null : Math.max(...sourceLags);
  const metadataAges = samples.flatMap(({ metadataOldestAgeSeconds }) =>
    metadataOldestAgeSeconds == null ? [] : [metadataOldestAgeSeconds],
  );
  const metadataOldestAgeMaximumSeconds =
    metadataAges.length === 0 ? null : Math.max(...metadataAges);
  const residentMemoryMaximumBytes = Math.max(
    0,
    ...samples.map(({ residentMemoryBytes }) => residentMemoryBytes),
  );
  const databaseHealthy = samples.length > 1 && samples.every(({ databaseUp }) => databaseUp === 1);
  const fallbackHealthy =
    !target.requireFallback ||
    (samples.length > 1 &&
      samples.every(
        ({ fallbackHealthySources, fallbackStalled }) =>
          fallbackHealthySources != null && fallbackHealthySources > 0 && fallbackStalled === 0,
      ));
  const failures: string[] = [];
  if (observedSeconds < config.minimumEvidenceSeconds) {
    failures.push(
      `observed ${observedSeconds}s, below the ${config.minimumEvidenceSeconds}s evidence minimum`,
    );
  }
  if (scrapeFailures > config.maximumScrapeFailures) {
    failures.push(
      `${scrapeFailures} scrape failures exceed the ${config.maximumScrapeFailures} failure budget`,
    );
  }
  if (!databaseHealthy) failures.push('database health was not continuously available');
  if (!fallbackHealthy) failures.push('fallback health was absent, unhealthy, or stalled');
  if (
    target.requireFallback &&
    (sourceLags.length !== samples.length ||
      sourceLagMaximumBlocks == null ||
      sourceLagMaximumBlocks > target.maximumSourceLagBlocks)
  ) {
    failures.push(
      `source lag ${sourceLagMaximumBlocks ?? 'missing'} exceeds ${target.maximumSourceLagBlocks} blocks or was absent`,
    );
  }
  if (blocksPerSecond < target.minimumBlocksPerSecond) {
    failures.push(
      `${blocksPerSecond} blocks/s is below the ${target.minimumBlocksPerSecond} blocks/s budget`,
    );
  }
  if (lagP95Seconds > target.maximumLagSeconds) {
    failures.push(`${lagP95Seconds}s p95 commit lag exceeds ${target.maximumLagSeconds}s`);
  }
  if (cursorDriftMaximum > 0) failures.push(`cursor drift reached ${cursorDriftMaximum} blocks`);
  if (
    target.metadataMetricsUrl != null &&
    (metadataOldestAgeMaximumSeconds == null ||
      metadataOldestAgeMaximumSeconds > target.maximumMetadataAgeSeconds)
  ) {
    failures.push(
      `metadata age ${metadataOldestAgeMaximumSeconds ?? 'missing'} exceeds ${target.maximumMetadataAgeSeconds}s`,
    );
  }
  if (residentMemoryMaximumBytes > target.maximumResidentMemoryBytes) {
    failures.push(
      `${residentMemoryMaximumBytes} resident bytes exceed ${target.maximumResidentMemoryBytes}`,
    );
  }
  const cpuCoresP95 = percentile(cpuRates(samples), 0.95);
  if (cpuCoresP95 > target.maximumCpuCores) {
    failures.push(`${cpuCoresP95} p95 CPU cores exceed ${target.maximumCpuCores}`);
  }
  return {
    network: target.network,
    samples: samples.length,
    scrapeFailures,
    scrapeErrorMessages: [...scrapeErrorMessages],
    observedSeconds,
    blocksPerSecond,
    processedBlocksPerSecond,
    lagP95Seconds,
    sourceLagMaximumBlocks,
    cursorDriftMaximum,
    metadataOldestAgeMaximumSeconds,
    residentMemoryMaximumBytes,
    cpuCoresP95,
    databaseHealthy,
    fallbackHealthy,
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

  const targets = config.targets.map((target) =>
    createTargetReport(
      target,
      samples.get(target.network) ?? [],
      failures.get(target.network) ?? 0,
      scrapeErrors.get(target.network) ?? [],
      config,
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
