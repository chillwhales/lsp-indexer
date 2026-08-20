const POSTGRES_IDENTIFIER_PATTERN = /^[a-z_][a-z0-9_]*$/;

export const API_SCHEMA = 'api';
export const SHARED_SCHEMA = 'lsp_v3';
export const API_OWNER_ROLE = 'lsp_indexer_v3_api_owner';
export const API_READER_ROLE = 'lsp_indexer_v3_api_reader';
export const DATABASE_SCHEMA_VERSION = 1;
export const CURSOR_TABLE = 'sqd_cursor';

export const SHARED_ENUMS = {
  asset_standard: ['unknown', 'lsp7', 'lsp8'],
  metadata_job_status: ['pending', 'processing', 'retry', 'succeeded', 'failed', 'cancelled'],
  metadata_kind: ['lsp3_profile', 'lsp4_asset', 'lsp4_token', 'lsp29_encrypted_asset', 'extension'],
  verification_status: ['unknown', 'verified', 'invalid'],
} as const;

/** Reject identifiers that cannot be safely used in PostgreSQL DDL or startup options. */
export function assertPostgresIdentifier(value: string, name = 'PostgreSQL identifier'): string {
  if (value.length > 63 || !POSTGRES_IDENTIFIER_PATTERN.test(value)) {
    throw new Error(`${name} must be a lowercase PostgreSQL identifier of at most 63 characters`);
  }
  return value;
}

/** Quote an already validated PostgreSQL identifier. */
export function quotePostgresIdentifier(value: string): string {
  return `"${assertPostgresIdentifier(value)}"`;
}

/** Stable owning role used by exactly one network runtime. */
export function createNetworkDatabaseRole(schema: string): string {
  return assertPostgresIdentifier(`lsp_v3_${assertPostgresIdentifier(schema)}_writer`);
}

/** Network-specific database URL environment variable. */
export function createNetworkDatabaseVariable(network: string): string {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(network)) {
    throw new Error('Network key must be lowercase kebab case');
  }
  return `DATABASE_URL_${network.replaceAll('-', '_').toUpperCase()}`;
}

/** Optional runtime-login variable consumed by the migration command. */
export function createRuntimeLoginVariable(network: string): string {
  return `DATABASE_RUNTIME_LOGIN_${createNetworkDatabaseVariable(network).slice('DATABASE_URL_'.length)}`;
}
