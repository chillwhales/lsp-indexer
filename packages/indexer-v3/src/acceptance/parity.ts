import {
  SHADOW_PARITY_DOMAINS,
  type EndpointDomain,
  type ShadowParityDomain,
  type ShadowParityField,
} from './parity-domains.js';

export {
  SHADOW_PARITY_DOMAINS,
  type ShadowParityDomain,
  type ShadowParityField,
} from './parity-domains.js';

const DEFAULT_PAGE_SIZE = 1_000;
const DEFAULT_MAX_ROWS = 1_000_000;
const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_REPORTED_DIFFERENCES = 25;

type NormalizedValue = boolean | null | string;
type NormalizedRow = Record<string, NormalizedValue>;

export interface ShadowParityConfig {
  sourceUrl: string;
  targetUrl: string;
  sourceSecret?: string;
  targetSecret?: string;
  network: string;
  expectedFinalizedBlock: number;
  pageSize: number;
  maxRowsPerDomain: number;
  timeoutMs: number;
}

export interface ShadowParityDifference {
  row: NormalizedRow;
  sourceOccurrences: number;
  targetOccurrences: number;
}

export interface ShadowParityDomainReport {
  domain: string;
  sourceCount: number;
  targetCount: number;
  comparedRows: number;
  truncated: boolean;
  differences: ShadowParityDifference[];
  passed: boolean;
}

export interface ShadowParityReport {
  generatedAt: string;
  network: string;
  expectedFinalizedBlock: number;
  targetIndexedBlock: number;
  targetFinalizedBlock: number;
  domains: ShadowParityDomainReport[];
  passed: boolean;
}

export type GraphqlRequester = (
  endpoint: string,
  secret: string | undefined,
  query: string,
  variables: Readonly<Record<string, unknown>>,
  timeoutMs: number,
) => Promise<Record<string, unknown>>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null && !Array.isArray(value);
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function readPositiveInteger(value: string | undefined, name: string, fallback?: number): number {
  if (value == null || value.trim() === '') {
    if (fallback != null) return fallback;
    throw new Error(`${name} is required`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive safe integer`);
  }
  return parsed;
}

function readEndpoint(value: string | undefined, name: string): string {
  if (value == null || value.trim() === '') throw new Error(`${name} is required`);
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

/** Load a strict same-height v2-to-v3 shadow comparison configuration. */
export function loadShadowParityConfig(env: NodeJS.ProcessEnv = process.env): ShadowParityConfig {
  const network = env.ACCEPTANCE_NETWORK?.trim();
  if (!network) throw new Error('ACCEPTANCE_NETWORK is required');
  return {
    sourceUrl: readEndpoint(env.V2_GRAPHQL_ENDPOINT, 'V2_GRAPHQL_ENDPOINT'),
    targetUrl: readEndpoint(env.V3_GRAPHQL_ENDPOINT, 'V3_GRAPHQL_ENDPOINT'),
    ...(env.V2_GRAPHQL_ADMIN_SECRET?.trim()
      ? { sourceSecret: env.V2_GRAPHQL_ADMIN_SECRET.trim() }
      : {}),
    ...(env.V3_GRAPHQL_ADMIN_SECRET?.trim()
      ? { targetSecret: env.V3_GRAPHQL_ADMIN_SECRET.trim() }
      : {}),
    network,
    expectedFinalizedBlock: readPositiveInteger(
      env.ACCEPTANCE_FINALIZED_BLOCK,
      'ACCEPTANCE_FINALIZED_BLOCK',
    ),
    pageSize: readPositiveInteger(
      env.ACCEPTANCE_PAGE_SIZE,
      'ACCEPTANCE_PAGE_SIZE',
      DEFAULT_PAGE_SIZE,
    ),
    maxRowsPerDomain: readPositiveInteger(
      env.ACCEPTANCE_MAX_ROWS_PER_DOMAIN,
      'ACCEPTANCE_MAX_ROWS_PER_DOMAIN',
      DEFAULT_MAX_ROWS,
    ),
    timeoutMs: readPositiveInteger(
      env.ACCEPTANCE_REQUEST_TIMEOUT_MS,
      'ACCEPTANCE_REQUEST_TIMEOUT_MS',
      DEFAULT_TIMEOUT_MS,
    ),
  };
}

function endpointWhere(endpoint: 'source' | 'target', domain: EndpointDomain): string {
  const predicates = [
    endpoint === 'target' ? 'network: {_eq: $network}' : '',
    domain.predicate ?? '',
  ]
    .filter(Boolean)
    .join(', ');
  return predicates === '' ? '' : `(where: {${predicates}})`;
}

function pageArguments(endpoint: 'source' | 'target', domain: EndpointDomain): string {
  const predicates = [
    endpoint === 'target' ? 'network: {_eq: $network}' : '',
    domain.predicate ?? '',
  ]
    .filter(Boolean)
    .join(', ');
  const where = predicates === '' ? '' : `where: {${predicates}}, `;
  const order = domain.order.map((name) => `{${name}: asc}`).join(', ');
  return `(${where}limit: $limit, offset: $offset, order_by: [${order}])`;
}

function operationName(prefix: string, domain: string): string {
  const words = domain.split(/[^A-Za-z0-9]+/).filter(Boolean);
  return `${prefix}${words.map((word) => `${word[0]?.toUpperCase() ?? ''}${word.slice(1)}`).join('')}`;
}

function countQuery(endpoint: 'source' | 'target', domain: ShadowParityDomain): string {
  const definition = domain[endpoint];
  const variables = endpoint === 'target' ? '($network: String!)' : '';
  return `query ${operationName('Count', domain.name)}${variables} { aggregate: ${definition.root}_aggregate${endpointWhere(endpoint, definition)} { aggregate { count } } }`;
}

function rowsQuery(endpoint: 'source' | 'target', domain: ShadowParityDomain): string {
  const definition = domain[endpoint];
  const variables =
    endpoint === 'target'
      ? '($network: String!, $limit: Int!, $offset: Int!)'
      : '($limit: Int!, $offset: Int!)';
  const fields = [...new Set(domain.fields.map((candidate) => candidate[endpoint]))].join(' ');
  return `query ${operationName('Rows', domain.name)}${variables} { rows: ${definition.root}${pageArguments(endpoint, definition)} { ${fields} } }`;
}

function normalizeCompactBytes(value: unknown, field: ShadowParityField): string {
  if (Array.isArray(value)) {
    if (!value.every((entry) => typeof entry === 'string')) {
      throw new Error(`${field.name} must contain only strings`);
    }
    return JSON.stringify(value.map((entry) => entry.toLowerCase()));
  }
  if (typeof value !== 'string' || !/^0x(?:[0-9A-Fa-f]{2})*$/.test(value)) {
    throw new Error(`${field.name} must be a CompactBytesArray hex value or string array`);
  }
  const entries: string[] = [];
  let offset = 2;
  while (offset < value.length) {
    if (offset + 4 > value.length) throw new Error(`${field.name} has a truncated length prefix`);
    const byteLength = Number.parseInt(value.slice(offset, offset + 4), 16);
    offset += 4;
    const end = offset + byteLength * 2;
    if (end > value.length) throw new Error(`${field.name} has a truncated entry`);
    entries.push(`0x${value.slice(offset, end).toLowerCase()}`);
    offset = end;
  }
  return JSON.stringify(entries);
}

function normalizeTokenType(value: unknown, field: ShadowParityField): string {
  const tokenTypes: Readonly<Record<string, string>> = {
    '0': 'TOKEN',
    '1': 'NFT',
    '2': 'COLLECTION',
    TOKEN: 'TOKEN',
    NFT: 'NFT',
    COLLECTION: 'COLLECTION',
  };
  const normalized = tokenTypes[String(value)];
  if (normalized == null) throw new Error(`${field.name} must be a supported token type`);
  return normalized;
}

function normalizeTokenIdFormat(value: unknown, field: ShadowParityField): string {
  const tokenIdFormats: Readonly<Record<string, string>> = {
    '0': 'NUMBER',
    '100': 'NUMBER',
    '1': 'STRING',
    '101': 'STRING',
    '2': 'ADDRESS',
    '102': 'ADDRESS',
    '3': 'BYTES32',
    '4': 'BYTES32',
    '103': 'BYTES32',
    '104': 'BYTES32',
    NUMBER: 'NUMBER',
    STRING: 'STRING',
    ADDRESS: 'ADDRESS',
    BYTES32: 'BYTES32',
  };
  const normalized = tokenIdFormats[String(value)];
  if (normalized == null) throw new Error(`${field.name} must be a supported token ID format`);
  return normalized;
}

function normalizeValue(value: unknown, field: ShadowParityField): NormalizedValue {
  if (value == null || value === '') return null;
  if (field.kind === 'boolean') {
    if (typeof value !== 'boolean') throw new Error(`${field.name} must be a boolean`);
    return value;
  }
  if (field.kind === 'compact-bytes') return normalizeCompactBytes(value, field);
  if (field.kind === 'token-type') return normalizeTokenType(value, field);
  if (field.kind === 'token-id-format') return normalizeTokenIdFormat(value, field);
  if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'bigint') {
    throw new Error(`${field.name} must be a scalar`);
  }
  const text = String(value);
  if (field.kind === 'integer') {
    try {
      return BigInt(text).toString();
    } catch {
      throw new Error(`${field.name} must be an integer`);
    }
  }
  if (field.kind === 'address' || field.kind === 'hex') return text.toLowerCase();
  return text;
}

function normalizeRow(
  row: Record<string, unknown>,
  endpoint: 'source' | 'target',
  domain: ShadowParityDomain,
): NormalizedRow {
  return Object.fromEntries(
    domain.fields.map((candidate) => [
      candidate.name,
      normalizeValue(row[candidate[endpoint]], candidate),
    ]),
  );
}

function signature(row: NormalizedRow): string {
  return JSON.stringify(row);
}

function readAggregateCount(data: Record<string, unknown>, domain: string): number {
  const aggregate = data.aggregate;
  if (!isRecord(aggregate) || !isRecord(aggregate.aggregate)) {
    throw new Error(`${domain} aggregate response is missing aggregate data`);
  }
  const count = aggregate.aggregate.count;
  if (typeof count !== 'number' || !Number.isSafeInteger(count) || count < 0) {
    throw new Error(`${domain} aggregate count is invalid`);
  }
  return count;
}

function readRows(data: Record<string, unknown>, domain: string): Record<string, unknown>[] {
  if (!Array.isArray(data.rows) || !data.rows.every(isRecord)) {
    throw new Error(`${domain} row response is invalid`);
  }
  return data.rows;
}

/** Issue one validated GraphQL request without placing secrets in the endpoint URL. */
export async function requestGraphql(
  endpoint: string,
  secret: string | undefined,
  query: string,
  variables: Readonly<Record<string, unknown>>,
  timeoutMs: number,
): Promise<Record<string, unknown>> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(secret == null ? {} : { 'x-hasura-admin-secret': secret }),
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`GraphQL endpoint returned HTTP ${response.status}`);
  const payload: unknown = await response.json();
  if (!isRecord(payload)) throw new Error('GraphQL endpoint returned an invalid response');
  if (isUnknownArray(payload.errors) && payload.errors.length > 0) {
    const first = payload.errors[0];
    const message =
      isRecord(first) && typeof first.message === 'string' ? first.message : 'unknown';
    throw new Error(`GraphQL request failed: ${message}`);
  }
  if (!isRecord(payload.data)) throw new Error('GraphQL response is missing data');
  return payload.data;
}

async function loadDomainRows(
  config: ShadowParityConfig,
  endpoint: 'source' | 'target',
  domain: ShadowParityDomain,
  count: number,
  requester: GraphqlRequester,
): Promise<{ rows: NormalizedRow[]; truncated: boolean }> {
  if (count > config.maxRowsPerDomain) return { rows: [], truncated: true };
  const url = endpoint === 'source' ? config.sourceUrl : config.targetUrl;
  const secret = endpoint === 'source' ? config.sourceSecret : config.targetSecret;
  const query = rowsQuery(endpoint, domain);
  const rows: NormalizedRow[] = [];
  for (let offset = 0; offset < count; offset += config.pageSize) {
    const limit = Math.min(config.pageSize, count - offset);
    const data = await requester(
      url,
      secret,
      query,
      { limit, offset, ...(endpoint === 'target' ? { network: config.network } : {}) },
      config.timeoutMs,
    );
    const page = readRows(data, domain.name);
    if (page.length !== limit) {
      throw new Error(
        `${domain.name} returned ${page.length} rows at offset ${offset}; expected ${limit}`,
      );
    }
    rows.push(...page.map((row) => normalizeRow(row, endpoint, domain)));
  }
  return { rows, truncated: false };
}

interface Occurrence {
  count: number;
  row: NormalizedRow;
}

function occurrenceMap(rows: readonly NormalizedRow[]): Map<string, Occurrence> {
  const result = new Map<string, Occurrence>();
  for (const row of rows) {
    const key = signature(row);
    result.set(key, { count: (result.get(key)?.count ?? 0) + 1, row });
  }
  return result;
}

/** Compare one mapped domain completely, with a hard row ceiling instead of silent sampling. */
export async function compareShadowDomain(
  config: ShadowParityConfig,
  domain: ShadowParityDomain,
  requester: GraphqlRequester = requestGraphql,
): Promise<ShadowParityDomainReport> {
  const [sourceData, targetData] = await Promise.all([
    requester(
      config.sourceUrl,
      config.sourceSecret,
      countQuery('source', domain),
      {},
      config.timeoutMs,
    ),
    requester(
      config.targetUrl,
      config.targetSecret,
      countQuery('target', domain),
      { network: config.network },
      config.timeoutMs,
    ),
  ]);
  const sourceCount = readAggregateCount(sourceData, domain.name);
  const targetCount = readAggregateCount(targetData, domain.name);
  const [source, target] = await Promise.all([
    loadDomainRows(config, 'source', domain, sourceCount, requester),
    loadDomainRows(config, 'target', domain, targetCount, requester),
  ]);
  const truncated = source.truncated || target.truncated;
  const sourceOccurrences = occurrenceMap(source.rows);
  const targetOccurrences = occurrenceMap(target.rows);
  const keys = [...new Set([...sourceOccurrences.keys(), ...targetOccurrences.keys()])].sort();
  const differences: ShadowParityDifference[] = [];
  let hasDifference = false;
  for (const key of keys) {
    const sourceOccurrence = sourceOccurrences.get(key);
    const targetOccurrence = targetOccurrences.get(key);
    if (sourceOccurrence?.count === targetOccurrence?.count) continue;
    hasDifference = true;
    const row = sourceOccurrence?.row ?? targetOccurrence?.row;
    if (row != null && differences.length < MAX_REPORTED_DIFFERENCES) {
      differences.push({
        row,
        sourceOccurrences: sourceOccurrence?.count ?? 0,
        targetOccurrences: targetOccurrence?.count ?? 0,
      });
    }
  }
  const passed = !truncated && sourceCount === targetCount && !hasDifference;
  return {
    domain: domain.name,
    sourceCount,
    targetCount,
    comparedRows: source.rows.length + target.rows.length,
    truncated,
    differences,
    passed,
  };
}

async function readTargetHead(
  config: ShadowParityConfig,
  requester: GraphqlRequester,
): Promise<{ indexed: number; finalized: number }> {
  const query = `query AcceptanceHead($network: String!) { rows: indexed_head(where: {network: {_eq: $network}}, limit: 1) { block_number finalized_block_number } }`;
  const data = await requester(
    config.targetUrl,
    config.targetSecret,
    query,
    { network: config.network },
    config.timeoutMs,
  );
  const rows = readRows(data, 'indexed-head');
  const head = rows[0];
  if (head == null) throw new Error(`No v3 indexed head exists for ${config.network}`);
  const indexed = Number(head.block_number);
  const finalized = Number(head.finalized_block_number);
  if (!Number.isSafeInteger(indexed) || !Number.isSafeInteger(finalized)) {
    throw new Error('The v3 indexed head contains invalid block numbers');
  }
  return { indexed, finalized };
}

/** Run strict, full-row shared-field parity against endpoints frozen at one finalized height. */
export async function runShadowParity(
  config: ShadowParityConfig,
  requester: GraphqlRequester = requestGraphql,
): Promise<ShadowParityReport> {
  const head = await readTargetHead(config, requester);
  if (
    head.indexed !== config.expectedFinalizedBlock ||
    head.finalized !== config.expectedFinalizedBlock
  ) {
    throw new Error(
      `V3 must be frozen and finalized at block ${config.expectedFinalizedBlock}; indexed=${head.indexed}, finalized=${head.finalized}`,
    );
  }
  const domains: ShadowParityDomainReport[] = [];
  for (const domain of SHADOW_PARITY_DOMAINS) {
    domains.push(await compareShadowDomain(config, domain, requester));
  }
  return {
    generatedAt: new Date().toISOString(),
    network: config.network,
    expectedFinalizedBlock: config.expectedFinalizedBlock,
    targetIndexedBlock: head.indexed,
    targetFinalizedBlock: head.finalized,
    domains,
    passed: domains.every(({ passed }) => passed),
  };
}
