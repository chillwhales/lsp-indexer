import {
  createNetworkSchema,
  getNetworkConfig,
  getNetworkKeys,
  type NetworkConfig,
  type RuntimeConfig,
} from '../config/index.js';
import {
  API_LOGIN_VARIABLE,
  assertPostgresIdentifier,
  createNetworkDatabaseRole,
  createNetworkDatabaseVariable,
  createRuntimeLoginVariable,
} from './names.js';

export interface NetworkDatabaseConfig {
  connectionString: string;
  schema: string;
  role: string;
  applicationName: string;
  poolMax: number;
  connectionTimeoutMs: number;
  idleTimeoutMs: number;
  statementTimeoutMs: number;
  lockTimeoutMs: number;
  idleTransactionTimeoutMs: number;
  unfinalizedBlocksRetention: number;
}

export interface DatabaseMigrationNetwork {
  network: NetworkConfig;
  schema: string;
  role: string;
  runtimeLogin?: string;
}

export interface DatabaseMigrationConfig {
  connectionString: string;
  networks: DatabaseMigrationNetwork[];
  apiLogin?: string;
}

function readPostgresUrl(value: string | undefined, name: string): string {
  const trimmed = value?.trim();
  if (!trimmed) throw new Error(`${name} is required`);

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error(`${name} must be an absolute PostgreSQL URL`);
  }
  if (url.protocol !== 'postgres:' && url.protocol !== 'postgresql:') {
    throw new Error(`${name} must use postgres or postgresql`);
  }
  return trimmed;
}

function readInteger(
  value: string | undefined,
  name: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  if (value == null || value.trim() === '') return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(`${name} must be a safe integer between ${minimum} and ${maximum}`);
  }
  return parsed;
}

function readRuntimeLogin(env: NodeJS.ProcessEnv, network: string): string | undefined {
  const variable = createRuntimeLoginVariable(network);
  const value = env[variable]?.trim();
  return value ? assertPostgresIdentifier(value, variable) : undefined;
}

function readMigrationNetworks(value: string | undefined): string[] {
  if (value == null || value.trim() === '') return getNetworkKeys();
  const networks = value
    .split(',')
    .map((network) => network.trim())
    .filter(Boolean);
  if (networks.length === 0) throw new Error('DATABASE_MIGRATION_NETWORKS cannot be empty');
  if (new Set(networks).size !== networks.length) {
    throw new Error('DATABASE_MIGRATION_NETWORKS contains duplicates');
  }
  return networks;
}

/** Load runtime database settings without making source-only diagnostics require PostgreSQL. */
export function loadNetworkDatabaseConfig(
  runtime: RuntimeConfig,
  env: NodeJS.ProcessEnv = process.env,
): NetworkDatabaseConfig {
  const networkVariable = createNetworkDatabaseVariable(runtime.network.key);
  const networkConnectionString = env[networkVariable]?.trim();
  const connectionString = readPostgresUrl(
    networkConnectionString || env.DATABASE_URL,
    `${networkVariable} or DATABASE_URL`,
  );

  return {
    connectionString,
    schema: runtime.databaseSchema,
    role: createNetworkDatabaseRole(runtime.databaseSchema),
    applicationName: `lsp-indexer-v3:${runtime.network.key}`,
    poolMax: readInteger(env.DATABASE_POOL_MAX, 'DATABASE_POOL_MAX', 10, 1, 100),
    connectionTimeoutMs: readInteger(
      env.DATABASE_CONNECTION_TIMEOUT_MS,
      'DATABASE_CONNECTION_TIMEOUT_MS',
      10_000,
      100,
      300_000,
    ),
    idleTimeoutMs: readInteger(
      env.DATABASE_IDLE_TIMEOUT_MS,
      'DATABASE_IDLE_TIMEOUT_MS',
      30_000,
      100,
      3_600_000,
    ),
    statementTimeoutMs: readInteger(
      env.DATABASE_STATEMENT_TIMEOUT_MS,
      'DATABASE_STATEMENT_TIMEOUT_MS',
      60_000,
      100,
      3_600_000,
    ),
    lockTimeoutMs: readInteger(
      env.DATABASE_LOCK_TIMEOUT_MS,
      'DATABASE_LOCK_TIMEOUT_MS',
      10_000,
      100,
      300_000,
    ),
    idleTransactionTimeoutMs: readInteger(
      env.DATABASE_IDLE_TRANSACTION_TIMEOUT_MS,
      'DATABASE_IDLE_TRANSACTION_TIMEOUT_MS',
      60_000,
      100,
      3_600_000,
    ),
    unfinalizedBlocksRetention: readInteger(
      env.DATABASE_UNFINALIZED_BLOCKS_RETENTION,
      'DATABASE_UNFINALIZED_BLOCKS_RETENTION',
      Math.max(1_000, runtime.network.finalityConfirmations * 4),
      runtime.network.finalityConfirmations + 1,
      1_000_000,
    ),
  };
}

/** Load the one-shot admin migration plan for all requested network schemas. */
export function loadDatabaseMigrationConfig(
  env: NodeJS.ProcessEnv = process.env,
): DatabaseMigrationConfig {
  const connectionString = readPostgresUrl(env.DATABASE_ADMIN_URL, 'DATABASE_ADMIN_URL');
  const networks = readMigrationNetworks(env.DATABASE_MIGRATION_NETWORKS).map((key) => {
    const network = getNetworkConfig(key);
    const schema = createNetworkSchema(network.key);
    const runtimeLogin = readRuntimeLogin(env, network.key);
    return {
      network,
      schema,
      role: createNetworkDatabaseRole(schema),
      ...(runtimeLogin == null ? {} : { runtimeLogin }),
    };
  });
  const runtimeLogins = networks.flatMap(({ runtimeLogin }) =>
    runtimeLogin == null ? [] : [runtimeLogin],
  );
  if (new Set(runtimeLogins).size !== runtimeLogins.length) {
    throw new Error('Each DATABASE_RUNTIME_LOGIN_<NETWORK> must identify a distinct login role');
  }

  const apiLoginValue = env[API_LOGIN_VARIABLE]?.trim();
  const apiLogin = apiLoginValue
    ? assertPostgresIdentifier(apiLoginValue, API_LOGIN_VARIABLE)
    : undefined;
  if (apiLogin != null && runtimeLogins.includes(apiLogin)) {
    throw new Error(`${API_LOGIN_VARIABLE} must differ from every runtime login`);
  }
  return { connectionString, networks, ...(apiLogin ? { apiLogin } : {}) };
}
