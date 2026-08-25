export const PRODUCTION_SOAK_SECONDS = 86_400;
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

function readTargets(value: string | undefined): SoakTarget[] {
  if (value == null) {
    throw new Error('ACCEPTANCE_METRICS_TARGETS is required');
  }
  let rawTargets: unknown;
  try {
    rawTargets = JSON.parse(value);
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
  return targets;
}

/** Load the multi-network metrics observation and performance budgets. */
export function loadSoakConfig(env: NodeJS.ProcessEnv = process.env): SoakConfig {
  const targets = readTargets(env.ACCEPTANCE_METRICS_TARGETS);
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
