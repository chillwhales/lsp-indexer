import { getTableName, sql } from 'drizzle-orm';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import { drizzle } from 'drizzle-orm/node-postgres';
import { fileURLToPath } from 'node:url';
import { Pool, type PoolClient } from 'pg';
import { createNetworkSchema, getNetworkKeys } from '../config/index.js';
import type { DatabaseMigrationConfig, DatabaseMigrationNetwork } from './config.js';
import {
  API_OWNER_ROLE,
  API_READER_ROLE,
  API_SCHEMA,
  DATABASE_SCHEMA_VERSION,
  SHARED_ENUMS,
  SHARED_SCHEMA,
  assertPostgresIdentifier,
  createNetworkDatabaseRole,
  quotePostgresIdentifier,
} from './names.js';
import * as schema from './schema.js';
import { networkConfig, publicTables } from './schema.js';

const defaultMigrationsDirectory = fileURLToPath(new URL('../../drizzle', import.meta.url));
const MIGRATIONS_TABLE = '__drizzle_migrations';
const MIGRATION_LOCK_KEY = 'lsp-indexer-v3:database-migration';

export interface DatabaseMigrationOptions {
  migrationsDirectory?: string;
}

export interface DatabaseMigrationResult {
  networks: { network: string; chainId: number; schema: string; role: string }[];
  apiSchema: string;
  publicViews: string[];
}

interface RoleAttributesRow {
  bypassRls: boolean;
  canLogin: boolean;
  createDatabase: boolean;
  createRole: boolean;
  inheritPrivileges: boolean;
  replication: boolean;
  superuser: boolean;
}

interface RoleNameRow {
  role: string;
}

interface SharedEnumDefinitionRow {
  kind: string;
  labels: string[];
}

interface ApiRelationRow {
  kind: string;
  name: string;
}

interface SchemaOwnerRow {
  owner: string;
}

interface CurrentUserRow {
  currentUser: string;
}

interface MigrationHistoryRow {
  hash: string;
  createdAt: string;
}

interface TableNameRow {
  tableName: string;
}

interface LockRow {
  acquired: boolean;
}

async function readRoleAttributes(
  client: PoolClient,
  role: string,
): Promise<RoleAttributesRow | undefined> {
  const result = await client.query<RoleAttributesRow>(
    `SELECT rolbypassrls AS "bypassRls",
            rolcanlogin AS "canLogin",
            rolcreatedb AS "createDatabase",
            rolcreaterole AS "createRole",
            rolinherit AS "inheritPrivileges",
            rolreplication AS replication,
            rolsuper AS superuser
     FROM pg_roles
     WHERE rolname = $1`,
    [role],
  );
  return result.rows[0];
}

function hasElevatedCapabilities(role: RoleAttributesRow): boolean {
  return (
    role.bypassRls || role.createDatabase || role.createRole || role.replication || role.superuser
  );
}

async function readReachableRoles(client: PoolClient, memberRole: string): Promise<string[]> {
  const result = await client.query<RoleNameRow>(
    `WITH RECURSIVE memberships(role_id) AS (
       SELECT membership.roleid
       FROM pg_auth_members membership
       JOIN pg_roles member_role ON member_role.oid = membership.member
       WHERE member_role.rolname = $1
       UNION
       SELECT membership.roleid
       FROM pg_auth_members membership
       JOIN memberships inherited ON inherited.role_id = membership.member
     )
     SELECT role.rolname AS role
     FROM memberships
     JOIN pg_roles role ON role.oid = memberships.role_id
     ORDER BY role.rolname`,
    [memberRole],
  );
  return result.rows.map(({ role }) => role);
}

async function ensureNoLoginRole(client: PoolClient, role: string): Promise<void> {
  const validated = assertPostgresIdentifier(role, 'database role');
  const existing = await readRoleAttributes(client, validated);
  if (existing == null) {
    await client.query(
      `CREATE ROLE ${quotePostgresIdentifier(validated)} NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS`,
    );
    return;
  }
  if (existing.canLogin || existing.inheritPrivileges || hasElevatedCapabilities(existing)) {
    throw new Error(
      `Existing database role "${validated}" must be NOLOGIN, NOINHERIT, NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOREPLICATION, and NOBYPASSRLS`,
    );
  }
  const reachableRoles = await readReachableRoles(client, validated);
  if (reachableRoles.length > 0) {
    throw new Error(
      `Existing database role "${validated}" must not be a member of other roles: ${reachableRoles.join(', ')}`,
    );
  }
}

async function ensureExistingLoginRole(client: PoolClient, role: string): Promise<void> {
  const validated = assertPostgresIdentifier(role, 'runtime login');
  const existing = await readRoleAttributes(client, validated);
  if (existing == null) {
    throw new Error(`Configured runtime login "${validated}" does not exist`);
  }
  if (!existing.canLogin || hasElevatedCapabilities(existing)) {
    throw new Error(
      `Configured runtime login "${validated}" must be LOGIN, NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOREPLICATION, and NOBYPASSRLS`,
    );
  }
}

async function findReachableWriterRoles(
  client: PoolClient,
  runtimeLogin: string,
  writerRoles: readonly string[],
): Promise<string[]> {
  const candidates = new Set(writerRoles);
  return (await readReachableRoles(client, runtimeLogin)).filter((role) => candidates.has(role));
}

async function ensureOwnedSchema(client: PoolClient, name: string, owner: string): Promise<void> {
  const schemaName = assertPostgresIdentifier(name, 'database schema');
  const role = assertPostgresIdentifier(owner, 'schema owner');
  const result = await client.query<SchemaOwnerRow>(
    `SELECT pg_get_userbyid(nspowner) AS owner FROM pg_namespace WHERE nspname = $1`,
    [schemaName],
  );
  const existing = result.rows[0];
  if (existing == null) {
    await client.query(
      `CREATE SCHEMA ${quotePostgresIdentifier(schemaName)} AUTHORIZATION ${quotePostgresIdentifier(role)}`,
    );
    return;
  }
  if (existing.owner !== role) {
    throw new Error(
      `Schema "${schemaName}" is owned by "${existing.owner}" instead of required role "${role}"`,
    );
  }
}

function quotePostgresLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

async function ensureSharedEnums(client: PoolClient): Promise<void> {
  await client.query(`SET LOCAL ROLE ${quotePostgresIdentifier(API_OWNER_ROLE)}`);
  for (const [name, values] of Object.entries(SHARED_ENUMS)) {
    const definition = await client.query<SharedEnumDefinitionRow>(
      `SELECT shared_type.typtype AS kind,
              ARRAY(
                SELECT enum_value.enumlabel::text
                FROM pg_enum enum_value
                WHERE enum_value.enumtypid = shared_type.oid
                ORDER BY enum_value.enumsortorder
              ) AS labels
       FROM pg_type shared_type
       JOIN pg_namespace namespace ON namespace.oid = shared_type.typnamespace
       WHERE namespace.nspname = $1 AND shared_type.typname = $2`,
      [SHARED_SCHEMA, name],
    );
    const existing = definition.rows[0];
    if (existing != null) {
      const labelsMatch =
        existing.labels.length === values.length &&
        values.every((value, index) => existing.labels[index] === value);
      if (existing.kind !== 'e' || !labelsMatch) {
        const actual =
          existing.kind === 'e'
            ? JSON.stringify(existing.labels)
            : `non-enum PostgreSQL type kind "${existing.kind}"`;
        throw new Error(
          `Existing shared type "${SHARED_SCHEMA}.${name}" must be an enum with labels in this order: ${JSON.stringify(values)}; found ${actual}`,
        );
      }
      continue;
    }
    await client.query(
      `CREATE TYPE ${quotePostgresIdentifier(SHARED_SCHEMA)}.${quotePostgresIdentifier(name)} AS ENUM (${values.map(quotePostgresLiteral).join(', ')})`,
    );
  }
  await client.query('RESET ROLE');
}

async function findUnexpectedApiRelations(
  client: PoolClient,
  viewNames: readonly string[],
): Promise<ApiRelationRow[]> {
  const result = await client.query<ApiRelationRow>(
    `SELECT relation.relkind AS kind, relation.relname AS name
     FROM pg_class relation
     JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
     WHERE namespace.nspname = $1
       AND relation.relkind IN ('r', 'p', 'v', 'm', 'f')
       AND NOT (relation.relkind = 'v' AND relation.relname = ANY($2::text[]))
     ORDER BY relation.relname`,
    [API_SCHEMA, viewNames],
  );
  return result.rows;
}

async function prepareRolesAndSchemas(
  client: PoolClient,
  networks: readonly DatabaseMigrationNetwork[],
): Promise<void> {
  await client.query('BEGIN');
  try {
    const currentUserResult = await client.query<CurrentUserRow>(
      'SELECT current_user AS "currentUser"',
    );
    const currentUser = currentUserResult.rows[0]?.currentUser;
    if (currentUser == null) throw new Error('PostgreSQL did not return current_user');
    assertPostgresIdentifier(currentUser, 'migration admin role');

    await ensureNoLoginRole(client, API_OWNER_ROLE);
    await ensureNoLoginRole(client, API_READER_ROLE);
    await client.query(
      `GRANT ${quotePostgresIdentifier(API_OWNER_ROLE)} TO ${quotePostgresIdentifier(currentUser)}`,
    );
    await ensureOwnedSchema(client, API_SCHEMA, API_OWNER_ROLE);
    await ensureOwnedSchema(client, SHARED_SCHEMA, API_OWNER_ROLE);
    await ensureSharedEnums(client);
    await client.query(
      `GRANT USAGE ON SCHEMA ${quotePostgresIdentifier(API_SCHEMA)} TO ${quotePostgresIdentifier(API_READER_ROLE)}`,
    );
    await client.query(
      `GRANT USAGE ON SCHEMA ${quotePostgresIdentifier(SHARED_SCHEMA)} TO ${quotePostgresIdentifier(API_READER_ROLE)}`,
    );

    for (const network of networks) {
      await ensureNoLoginRole(client, network.role);
      await client.query(
        `GRANT ${quotePostgresIdentifier(network.role)} TO ${quotePostgresIdentifier(currentUser)}`,
      );
      await ensureOwnedSchema(client, network.schema, network.role);
      const sharedTypes = Object.keys(SHARED_ENUMS)
        .map((name) => `${quotePostgresIdentifier(SHARED_SCHEMA)}.${quotePostgresIdentifier(name)}`)
        .join(', ');
      await client.query(
        `GRANT USAGE ON SCHEMA ${quotePostgresIdentifier(SHARED_SCHEMA)} TO ${quotePostgresIdentifier(network.role)}`,
      );
      await client.query(
        `GRANT USAGE ON TYPE ${sharedTypes} TO ${quotePostgresIdentifier(network.role)}, ${quotePostgresIdentifier(API_READER_ROLE)}`,
      );
      if (network.runtimeLogin != null) {
        await ensureExistingLoginRole(client, network.runtimeLogin);
        await client.query(
          `GRANT ${quotePostgresIdentifier(network.role)} TO ${quotePostgresIdentifier(network.runtimeLogin)}`,
        );
      }
    }

    const writerRoles = getNetworkKeys().map((network) =>
      createNetworkDatabaseRole(createNetworkSchema(network)),
    );
    for (const network of networks) {
      if (network.runtimeLogin == null) continue;
      const foreignRoles = writerRoles.filter((role) => role !== network.role);
      const reachableRoles = await findReachableWriterRoles(
        client,
        network.runtimeLogin,
        foreignRoles,
      );
      if (reachableRoles.length > 0) {
        throw new Error(
          `Configured runtime login "${network.runtimeLogin}" can assume foreign network roles: ${reachableRoles.join(', ')}`,
        );
      }
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

async function verifyMigrationHistory(
  client: PoolClient,
  networkSchema: string,
  migrationsDirectory: string,
): Promise<void> {
  const expected = readMigrationFiles({ migrationsFolder: migrationsDirectory });
  const result = await client.query<MigrationHistoryRow>(
    `SELECT hash, created_at AS "createdAt" FROM ${quotePostgresIdentifier(networkSchema)}.${quotePostgresIdentifier(MIGRATIONS_TABLE)} ORDER BY created_at`,
  );
  if (result.rows.length !== expected.length) {
    throw new Error(
      `Migration history mismatch in "${networkSchema}": expected ${expected.length}, found ${result.rows.length}`,
    );
  }

  for (const [index, migration] of expected.entries()) {
    const applied = result.rows[index];
    if (
      applied == null ||
      applied.hash !== migration.hash ||
      Number(applied.createdAt) !== migration.folderMillis
    ) {
      throw new Error(`Migration drift detected in "${networkSchema}" at migration ${index}`);
    }
  }
}

async function assertSnapshotEvolutionSafe(
  client: PoolClient,
  networkSchema: string,
  hasAppliedMigrations: boolean,
  hasPendingMigrations: boolean,
): Promise<void> {
  if (!hasAppliedMigrations || !hasPendingMigrations) return;
  const tables = await client.query<TableNameRow>(
    `SELECT tablename AS "tableName"
     FROM pg_tables
     WHERE schemaname = $1 AND right(tablename, 11) = '__snapshots'
     ORDER BY tablename`,
    [networkSchema],
  );
  if (tables.rows.length > 0) {
    throw new Error(
      `Pending schema migrations cannot run in "${networkSchema}" while rollback snapshot artifacts exist. Rebuild the alpha database or use an owner-approved snapshot-preserving procedure.`,
    );
  }
}

async function migrateNetwork(
  client: PoolClient,
  network: DatabaseMigrationNetwork,
  migrationsDirectory: string,
): Promise<void> {
  await client.query(`SET ROLE ${quotePostgresIdentifier(network.role)}`);
  await client.query(
    `SET search_path TO ${quotePostgresIdentifier(network.schema)}, ${quotePostgresIdentifier(SHARED_SCHEMA)}, ${quotePostgresIdentifier('public')}`,
  );
  try {
    const db = drizzle(client, { schema });
    const migrationTable = `${quotePostgresIdentifier(network.schema)}.${quotePostgresIdentifier(MIGRATIONS_TABLE)}`;
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${migrationTable} (
        id serial PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint NOT NULL
      )
    `);
    const migrations = readMigrationFiles({ migrationsFolder: migrationsDirectory });
    const appliedResult = await client.query<MigrationHistoryRow>(
      `SELECT hash, created_at AS "createdAt" FROM ${migrationTable} ORDER BY created_at`,
    );
    for (const [index, applied] of appliedResult.rows.entries()) {
      const expected = migrations[index];
      if (
        expected == null ||
        applied.hash !== expected.hash ||
        Number(applied.createdAt) !== expected.folderMillis
      ) {
        throw new Error(`Migration drift detected in "${network.schema}" at migration ${index}`);
      }
    }

    await assertSnapshotEvolutionSafe(
      client,
      network.schema,
      appliedResult.rows.length > 0,
      appliedResult.rows.length < migrations.length,
    );

    await db.transaction(async (tx): Promise<void> => {
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtext(${`lsp-indexer-v3:migrations:${network.schema}`})::bigint)`,
      );
      for (const migration of migrations.slice(appliedResult.rows.length)) {
        for (const statement of migration.sql) {
          if (statement.trim().length > 0) await tx.execute(sql.raw(statement));
        }
        await tx.execute(sql`
          INSERT INTO ${sql.raw(migrationTable)} (hash, created_at)
          VALUES (${migration.hash}, ${migration.folderMillis})
        `);
      }
    });
    await db
      .insert(networkConfig)
      .values({
        network: network.network.key,
        chainId: network.network.chainId,
        schemaVersion: DATABASE_SCHEMA_VERSION,
      })
      .onConflictDoUpdate({
        target: [networkConfig.network, networkConfig.chainId],
        set: { schemaVersion: DATABASE_SCHEMA_VERSION },
      });

    const publicTableList = publicTables
      .map((table) => quotePostgresIdentifier(getTableName(table)))
      .join(', ');
    await client.query(
      `GRANT USAGE ON SCHEMA ${quotePostgresIdentifier(network.schema)} TO ${quotePostgresIdentifier(API_OWNER_ROLE)}`,
    );
    await client.query(
      `GRANT SELECT ON ${publicTableList} TO ${quotePostgresIdentifier(API_OWNER_ROLE)}`,
    );
    await verifyMigrationHistory(client, network.schema, migrationsDirectory);
  } finally {
    await client.query('RESET ROLE');
    await client.query(`SET search_path TO ${quotePostgresIdentifier('public')}`);
  }
}

async function rebuildApiViews(
  client: PoolClient,
  networks: readonly DatabaseMigrationNetwork[],
): Promise<string[]> {
  const viewNames = publicTables.map(getTableName);
  await client.query(`SET ROLE ${quotePostgresIdentifier(API_OWNER_ROLE)}`);
  await client.query(
    `SET search_path TO ${quotePostgresIdentifier(API_SCHEMA)}, ${quotePostgresIdentifier(SHARED_SCHEMA)}, ${quotePostgresIdentifier('public')}`,
  );
  try {
    await client.query('BEGIN');
    for (const viewName of viewNames) {
      const view = quotePostgresIdentifier(viewName);
      const selections = networks
        .map(
          (network) =>
            `SELECT * FROM ${quotePostgresIdentifier(network.schema)}.${quotePostgresIdentifier(viewName)}`,
        )
        .join(' UNION ALL ');
      await client.query(
        `CREATE OR REPLACE VIEW ${quotePostgresIdentifier(API_SCHEMA)}.${view} WITH (security_barrier = true) AS ${selections}`,
      );
    }
    const unexpectedRelations = await findUnexpectedApiRelations(client, viewNames);
    if (unexpectedRelations.length > 0) {
      throw new Error(
        `API schema contains unexpected relations: ${unexpectedRelations.map(({ kind, name }) => `${name} (${kind})`).join(', ')}`,
      );
    }
    await client.query(
      `REVOKE SELECT ON ALL TABLES IN SCHEMA ${quotePostgresIdentifier(API_SCHEMA)} FROM ${quotePostgresIdentifier(API_READER_ROLE)}`,
    );
    const publicViewList = viewNames
      .map(
        (viewName) => `${quotePostgresIdentifier(API_SCHEMA)}.${quotePostgresIdentifier(viewName)}`,
      )
      .join(', ');
    await client.query(
      `GRANT SELECT ON ${publicViewList} TO ${quotePostgresIdentifier(API_READER_ROLE)}`,
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.query('RESET ROLE');
    await client.query(`SET search_path TO ${quotePostgresIdentifier('public')}`);
  }
  return viewNames;
}

/** Apply one migration series to every chain schema and atomically rebuild unified API views. */
export async function migrateDatabaseWithPool(
  pool: Pool,
  config: DatabaseMigrationConfig,
  options: DatabaseMigrationOptions = {},
): Promise<DatabaseMigrationResult> {
  if (config.networks.length === 0) throw new Error('At least one migration network is required');
  const migrationsDirectory = options.migrationsDirectory ?? defaultMigrationsDirectory;
  const client = await pool.connect();
  let lockAcquired = false;
  try {
    const lockResult = await client.query<LockRow>(
      'SELECT pg_try_advisory_lock(hashtext($1)::bigint) AS acquired',
      [MIGRATION_LOCK_KEY],
    );
    lockAcquired = lockResult.rows[0]?.acquired ?? false;
    if (!lockAcquired) {
      throw new Error('Another v3 database migration is already running');
    }

    await prepareRolesAndSchemas(client, config.networks);
    for (const network of config.networks) {
      await migrateNetwork(client, network, migrationsDirectory);
    }
    const publicViews = await rebuildApiViews(client, config.networks);
    return {
      networks: config.networks.map((network) => ({
        network: network.network.key,
        chainId: network.network.chainId,
        schema: network.schema,
        role: network.role,
      })),
      apiSchema: API_SCHEMA,
      publicViews,
    };
  } finally {
    try {
      if (lockAcquired) {
        await client.query('SELECT pg_advisory_unlock(hashtext($1)::bigint)', [MIGRATION_LOCK_KEY]);
      }
    } finally {
      client.release();
    }
  }
}

/** Open the admin connection, run the complete migration plan, and always close it. */
export async function migrateDatabase(
  config: DatabaseMigrationConfig,
  options: DatabaseMigrationOptions = {},
): Promise<DatabaseMigrationResult> {
  const pool = new Pool({
    connectionString: config.connectionString,
    application_name: 'lsp-indexer-v3:migrator',
    max: 1,
  });
  try {
    return await migrateDatabaseWithPool(pool, config, options);
  } finally {
    await pool.end();
  }
}
