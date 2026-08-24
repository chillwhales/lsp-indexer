import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { NetworkDatabaseConfig } from './config.js';
import { SHARED_SCHEMA, assertPostgresIdentifier } from './names.js';

export type NetworkDatabase = NodePgDatabase;

function createStartupOptions(config: NetworkDatabaseConfig): string {
  const role = assertPostgresIdentifier(config.role, 'database role');
  const databaseSchema = assertPostgresIdentifier(config.schema, 'database schema');
  return [
    `-c role=${role}`,
    `-c search_path=${databaseSchema},${SHARED_SCHEMA},public`,
    `-c statement_timeout=${config.statementTimeoutMs}`,
    `-c lock_timeout=${config.lockTimeoutMs}`,
    `-c idle_in_transaction_session_timeout=${config.idleTransactionTimeoutMs}`,
  ].join(' ');
}

/** Create a role- and schema-pinned pool for one production network process. */
export function createNetworkPool(config: NetworkDatabaseConfig): Pool {
  return new Pool({
    connectionString: config.connectionString,
    application_name: config.applicationName,
    max: config.poolMax,
    connectionTimeoutMillis: config.connectionTimeoutMs,
    idleTimeoutMillis: config.idleTimeoutMs,
    options: createStartupOptions(config),
  });
}

/** Bind Drizzle's unqualified tables to a pool whose search path selects one chain schema. */
export function createNetworkDatabase(pool: Pool): NetworkDatabase {
  return drizzle(pool);
}
