export interface PrometheusSample {
  name: string;
  labels: Readonly<Record<string, string>>;
  value: number;
}

const PROMETHEUS_SAMPLE_EXPRESSION =
  /^([A-Za-z_:][A-Za-z0-9_:]*)(?:\{(.*)\})?\s+([^\s]+)(?:\s+\d+)?$/;

function unescapeLabel(value: string): string {
  return value.split('\\n').join('\n').split('\\"').join('"').split('\\\\').join('\\');
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

function parsePrometheusLine(line: string): PrometheusSample | undefined {
  if (line === '' || line.startsWith('#')) return undefined;
  const match = PROMETHEUS_SAMPLE_EXPRESSION.exec(line);
  if (match == null || match[1] == null || match[3] == null) {
    throw new Error(`Invalid Prometheus sample: ${line}`);
  }
  const value = Number(match[3]);
  if (!Number.isFinite(value)) return undefined;
  return { name: match[1], labels: parseLabels(match[2]), value };
}

/** Parse the Prometheus text samples needed by the v3 acceptance observer. */
export function parsePrometheusText(text: string): PrometheusSample[] {
  const samples: PrometheusSample[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const sample = parsePrometheusLine(rawLine.trim());
    if (sample != null) samples.push(sample);
  }
  return samples;
}

export function values(
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

export function requiredMaximum(
  samples: readonly PrometheusSample[],
  metric: string,
  labels: Readonly<Record<string, string>>,
): number {
  const matches = values(samples, metric, labels);
  if (matches.length === 0) throw new Error(`Required metric ${metric} is absent`);
  return Math.max(...matches);
}

export function optionalMaximum(
  samples: readonly PrometheusSample[],
  metric: string,
  labels: Readonly<Record<string, string>>,
): number | null {
  const matches = values(samples, metric, labels);
  return matches.length === 0 ? null : Math.max(...matches);
}
