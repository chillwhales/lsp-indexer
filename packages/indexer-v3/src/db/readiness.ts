import { sql } from 'drizzle-orm';
import { getNetworkKeys, type RuntimeConfig } from '../config/index.js';
import type { NetworkDatabase } from './client.js';
import { DATABASE_SCHEMA_VERSION, SHARED_SCHEMA, createNetworkDatabaseRole } from './names.js';

interface DatabaseIdentityRow extends Record<string, unknown> {
  currentRole: string;
  currentSchema: string | null;
  searchPath: string;
  searchPathSchemas: string[];
}

interface NetworkConfigRow extends Record<string, unknown> {
  network: string;
  chainId: string;
  schemaVersion: number;
}

interface ForeignWritePrivilegeRow extends Record<string, unknown> {
  schema: string;
}

export interface DatabaseReadiness {
  currentRole: string;
  currentSchema: string;
  searchPath: string;
  network: string;
  chainId: number;
  schemaVersion: number;
}

/** Verify role, search path, seed identity, and cross-network write isolation at startup. */
export async function verifyDatabaseReadiness(
  db: NetworkDatabase,
  runtime: RuntimeConfig,
): Promise<DatabaseReadiness> {
  const identity = await db.execute<DatabaseIdentityRow>(sql`
    SELECT current_role AS "currentRole",
           current_schema() AS "currentSchema",
           current_setting('search_path') AS "searchPath",
           current_schemas(false)::text[] AS "searchPathSchemas"
  `);
  const row = identity.rows[0];
  if (row == null) throw new Error('PostgreSQL did not return connection identity');

  const expectedRole = createNetworkDatabaseRole(runtime.databaseSchema);
  if (row.currentRole !== expectedRole) {
    throw new Error(`Database role is "${row.currentRole}"; expected "${expectedRole}"`);
  }
  if (row.currentSchema !== runtime.databaseSchema) {
    throw new Error(
      `Database current_schema is "${row.currentSchema ?? 'null'}"; expected "${runtime.databaseSchema}"`,
    );
  }
  const expectedSearchPath = [runtime.databaseSchema, SHARED_SCHEMA, 'public'];
  if (
    row.searchPathSchemas.length !== expectedSearchPath.length ||
    row.searchPathSchemas.some((schema, index) => schema !== expectedSearchPath[index])
  ) {
    throw new Error(
      `Database search_path resolves to "${row.searchPathSchemas.join(',')}"; expected "${expectedSearchPath.join(',')}"`,
    );
  }

  const networkResult = await db.execute<NetworkConfigRow>(sql`
    SELECT network, chain_id AS "chainId", schema_version AS "schemaVersion"
    FROM network_config
  `);
  const networkRows = networkResult.rows;
  if (networkRows.length !== 1) {
    throw new Error(`Expected one network_config row; found ${networkRows.length}`);
  }
  const network = networkRows[0];
  if (
    network == null ||
    network.network !== runtime.network.key ||
    Number(network.chainId) !== runtime.network.chainId
  ) {
    throw new Error('Database network identity does not match INDEXER_NETWORK');
  }
  if (network.schemaVersion !== DATABASE_SCHEMA_VERSION) {
    throw new Error(
      `Database schema version is ${network.schemaVersion}; expected ${DATABASE_SCHEMA_VERSION}`,
    );
  }

  const foreignSchemas = getNetworkKeys()
    .map((key) => `chain_${key.replaceAll('-', '_')}`)
    .filter((schema) => schema !== runtime.databaseSchema);
  const foreignSchemaList = sql.join(
    foreignSchemas.map((schema) => sql`${schema}`),
    sql`, `,
  );
  const privilegeResult = await db.execute<ForeignWritePrivilegeRow>(sql`
    SELECT n.nspname AS schema
     FROM pg_namespace n
     WHERE n.nspname IN (${foreignSchemaList})
       AND (
         has_schema_privilege(current_role, n.oid, 'CREATE')
         OR EXISTS (
           SELECT 1 FROM pg_class c
           WHERE c.relnamespace = n.oid
             AND c.relkind IN ('r', 'p')
             AND (
               has_table_privilege(current_role, c.oid, 'INSERT')
               OR has_table_privilege(current_role, c.oid, 'UPDATE')
               OR has_table_privilege(current_role, c.oid, 'DELETE')
               OR has_table_privilege(current_role, c.oid, 'TRUNCATE')
             )
         )
       )
  `);
  if (privilegeResult.rows.length > 0) {
    throw new Error(
      `Database role can write foreign network schemas: ${privilegeResult.rows.map(({ schema }) => schema).join(', ')}`,
    );
  }

  return {
    currentRole: row.currentRole,
    currentSchema: row.currentSchema,
    searchPath: row.searchPath,
    network: network.network,
    chainId: Number(network.chainId),
    schemaVersion: network.schemaVersion,
  };
}
