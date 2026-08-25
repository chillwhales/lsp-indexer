import { getTableName, sql } from 'drizzle-orm';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import { drizzle } from 'drizzle-orm/node-postgres';
import { fileURLToPath } from 'node:url';
import { escapeIdentifier, Pool, type PoolClient } from 'pg';
import { createNetworkSchema, getNetworkConfig } from '../config/index.js';
import type { DatabaseMigrationConfig, DatabaseMigrationNetwork } from './config.js';
import {
  API_OWNER_ROLE,
  API_READER_ROLE,
  API_SCHEMA,
  assertPostgresIdentifier,
  createNetworkDatabaseRole,
  DATABASE_SCHEMA_VERSION,
  MIGRATIONS_TABLE,
  quotePostgresIdentifier,
  SHARED_ENUMS,
  SHARED_SCHEMA,
} from './names.js';
import {
  API_VIEW_DEPENDENCY_COLUMNS,
  createChainAclBoundaryQuery,
  createChainObjectOwnershipQuery,
  createWriterRoleBoundaryQuery,
  formatChainObjectOwnership,
  type ChainAclBoundaryRow,
  type ChainObjectOwnershipRow,
} from './roleBoundary.js';
import * as schema from './schema.js';
import { networkConfig, publicTables } from './schema.js';
import {
  assertChainSchemaFingerprint,
  createChainSchemaFingerprintQuery,
  type ChainSchemaFingerprintRow,
} from './schemaFingerprint.js';

const defaultMigrationsDirectory = fileURLToPath(new URL('../../drizzle', import.meta.url));
const MIGRATION_LOCK_KEY = 'lsp-indexer-v3:database-migration';
const DESTRUCTIVE_REPLAY_MARKER = '-- lsp-indexer-v3: destructive-replay';
const RESERVED_MIGRATION_SCHEMAS = new Set([
  API_SCHEMA,
  SHARED_SCHEMA,
  'information_schema',
  'pg_catalog',
  'public',
]);
const RESERVED_MIGRATION_ROLES = new Set([API_OWNER_ROLE, API_READER_ROLE]);

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

interface RoleMembershipOptionsRow {
  adminOption: boolean;
  inheritOption: boolean;
  setOption: boolean;
}

interface LoginRoleRequirements {
  loginDescription: 'API login' | 'runtime login';
  assignedRoleDescription: 'reader role' | 'writer role';
  inheritOption?: boolean;
  setOption: boolean;
}

const API_LOGIN_REQUIREMENTS: LoginRoleRequirements = {
  loginDescription: 'API login',
  assignedRoleDescription: 'reader role',
  inheritOption: true,
  setOption: false,
};

const RUNTIME_LOGIN_REQUIREMENTS: LoginRoleRequirements = {
  loginDescription: 'runtime login',
  assignedRoleDescription: 'writer role',
  setOption: true,
};

interface SharedEnumDefinitionRow {
  kind: string;
  labels: string[];
}

interface RelationInventoryRow {
  kind: string;
  name: string;
}

interface RoutineInventoryRow {
  kind: string;
  signature: string;
}

interface SharedObjectRow {
  kind: string;
  name: string;
}

interface ReaderPrivilegeRow {
  grantee: string;
  kind: string;
  object: string;
  privilege: string;
}

interface RoleDependencyRow extends Record<string, unknown> {
  kind: string;
  object: string;
}

interface SchemaOwnerRow {
  owner: string;
}

interface CurrentConnectionRow {
  currentDatabase: string;
  currentUser: string;
}

interface MigrationHistoryRow {
  hash: string;
  createdAt: string;
}

interface MigrationCountRow {
  count: string;
}

interface TableNameRow {
  tableName: string;
}

interface LockRow {
  acquired: boolean;
}

interface TableExistsRow {
  exists: boolean;
}

interface NetworkIdentityRow {
  network: string;
  chainId: string;
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
     SELECT DISTINCT role.rolname AS role
     FROM memberships
     JOIN pg_roles role ON role.oid = memberships.role_id
     ORDER BY role.rolname`,
    [memberRole],
  );
  return result.rows.map(({ role }) => role);
}

async function readRolesReachingRole(client: PoolClient, grantedRole: string): Promise<string[]> {
  const result = await client.query<RoleNameRow>(
    `WITH RECURSIVE memberships(member_id) AS (
       SELECT membership.member
       FROM pg_auth_members membership
       JOIN pg_roles granted_role ON granted_role.oid = membership.roleid
       WHERE granted_role.rolname = $1
       UNION
       SELECT membership.member
       FROM pg_auth_members membership
       JOIN memberships inherited ON inherited.member_id = membership.roleid
     )
     SELECT DISTINCT role.rolname AS role
     FROM memberships
     JOIN pg_roles role ON role.oid = memberships.member_id
     ORDER BY role.rolname`,
    [grantedRole],
  );
  return result.rows.map(({ role }) => role);
}

async function ensureExclusiveRoleMembers(
  client: PoolClient,
  role: string,
  allowedMembers: readonly string[],
  roleDescription: string,
): Promise<void> {
  const validatedRole = assertPostgresIdentifier(role, 'database role');
  const allowed = new Set(
    allowedMembers.map((member) => assertPostgresIdentifier(member, 'allowed role member')),
  );
  const unexpectedMembers = (await readRolesReachingRole(client, validatedRole)).filter(
    (member) => !allowed.has(member),
  );
  if (unexpectedMembers.length > 0) {
    throw new Error(
      `${roleDescription} "${validatedRole}" has unexpected direct or transitive members: ${unexpectedMembers.join(', ')}. Revoke their membership before retrying`,
    );
  }
}

async function ensureMembershipOptions(
  client: PoolClient,
  memberRole: string,
  grantedRole: string,
  requirements: LoginRoleRequirements,
): Promise<void> {
  const result = await client.query<RoleMembershipOptionsRow>(
    `SELECT membership.admin_option AS "adminOption",
            membership.inherit_option AS "inheritOption",
            membership.set_option AS "setOption"
     FROM pg_auth_members membership
     JOIN pg_roles member_role ON member_role.oid = membership.member
     JOIN pg_roles granted_role ON granted_role.oid = membership.roleid
     WHERE member_role.rolname = $1 AND granted_role.rolname = $2`,
    [memberRole, grantedRole],
  );
  if (result.rows.some(({ adminOption }) => adminOption)) {
    throw new Error(
      `Configured ${requirements.loginDescription} "${memberRole}" must not hold ADMIN OPTION on "${grantedRole}"`,
    );
  }
  if (
    result.rows.length > 0 &&
    result.rows.some(({ setOption }) => setOption !== requirements.setOption)
  ) {
    throw new Error(
      `Configured ${requirements.loginDescription} "${memberRole}" must ${requirements.setOption ? 'hold' : 'not hold'} SET OPTION on "${grantedRole}"`,
    );
  }
  if (
    requirements.inheritOption != null &&
    result.rows.length > 0 &&
    result.rows.some(({ inheritOption }) => inheritOption !== requirements.inheritOption)
  ) {
    throw new Error(
      `Configured ${requirements.loginDescription} "${memberRole}" must ${requirements.inheritOption ? 'hold' : 'not hold'} INHERIT OPTION on "${grantedRole}"`,
    );
  }
}

async function ensureWriterRolePrivilegeBoundary(
  client: PoolClient,
  role: string,
  networkSchema: string,
): Promise<void> {
  const result = await drizzle(client).execute<RoleDependencyRow>(
    createWriterRoleBoundaryQuery(role, networkSchema),
  );
  if (result.rows.length > 0) {
    throw new Error(
      `Database writer role "${role}" has privileges, ownership, default privileges, or policy references outside assigned schema "${networkSchema}": ${result.rows.map(({ kind, object }) => `${object} (${kind})`).join(', ')}`,
    );
  }
}

async function ensureChainAclBoundary(
  client: PoolClient,
  role: string,
  networkSchema: string,
): Promise<void> {
  const result = await drizzle(client).execute<ChainAclBoundaryRow>(
    createChainAclBoundaryQuery(role, networkSchema),
  );
  if (result.rows.length > 0) {
    throw new Error(
      `Database schema "${networkSchema}" grants privileges to unapproved roles: ${result.rows.map(({ grantee, kind, object, privilege }) => `${object} (${kind} ${privilege} via ${grantee})`).join(', ')}`,
    );
  }
}

async function normalizeChainRoutinePrivileges(
  client: PoolClient,
  role: string,
  networkSchema: string,
): Promise<void> {
  await client.query(`SET LOCAL ROLE ${quotePostgresIdentifier(role)}`);
  // PostgreSQL's built-in PUBLIC EXECUTE default is global. A schema-scoped
  // REVOKE only reverses a schema-scoped GRANT and cannot remove that default.
  await client.query('ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC');
  await client.query(
    `REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA ${quotePostgresIdentifier(networkSchema)} FROM PUBLIC`,
  );
  await client.query('RESET ROLE');
}

async function ensureChainObjectOwnership(
  client: PoolClient,
  role: string,
  networkSchema: string,
  requireAllObjects = true,
): Promise<void> {
  const result = await drizzle(client).execute<ChainObjectOwnershipRow>(
    createChainObjectOwnershipQuery(role, networkSchema, requireAllObjects),
  );
  if (result.rows.length > 0) {
    throw new Error(
      `Database writer role "${role}" must own every expected object in schema "${networkSchema}": ${formatChainObjectOwnership(result.rows)}`,
    );
  }
}

async function ensureChainSchemaFingerprint(
  client: PoolClient,
  networkSchema: string,
): Promise<void> {
  const result = await drizzle(client).execute<ChainSchemaFingerprintRow>(
    createChainSchemaFingerprintQuery(networkSchema),
  );
  assertChainSchemaFingerprint(networkSchema, result.rows[0]?.fingerprint);
}

async function ensureCurrentChainTableOwnership(
  client: PoolClient,
  network: DatabaseMigrationNetwork,
  migrationsDirectory: string,
): Promise<void> {
  const tableExists = await client.query<TableExistsRow>(
    `SELECT EXISTS (
       SELECT 1
       FROM pg_class relation
       JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
       WHERE namespace.nspname = $1
         AND relation.relname = $2
         AND relation.relkind IN ('r', 'p')
     ) AS exists`,
    [network.schema, MIGRATIONS_TABLE],
  );
  if (tableExists.rows[0]?.exists !== true) return;

  const applied = await client.query<MigrationCountRow>(
    `SELECT count(*)::text AS count
     FROM ${quotePostgresIdentifier(network.schema)}.${quotePostgresIdentifier(MIGRATIONS_TABLE)}`,
  );
  const expectedCount = readMigrationFiles({ migrationsFolder: migrationsDirectory }).length;
  if (Number(applied.rows[0]?.count) === expectedCount) {
    await ensureChainObjectOwnership(client, network.role, network.schema);
    await ensureChainSchemaFingerprint(client, network.schema);
  }
}

async function findUnexpectedRoleDependencies(
  client: PoolClient,
  role: string,
): Promise<RoleDependencyRow[]> {
  const validated = assertPostgresIdentifier(role, 'runtime login');
  const result = await client.query<RoleDependencyRow>(
    `WITH runtime_role AS (
       SELECT oid FROM pg_roles WHERE rolname = $1
     ), current_database_object AS (
       SELECT oid, datacl FROM pg_database WHERE datname = current_database()
     )
     SELECT CASE dependency.deptype
              WHEN 'a' THEN 'ACL'
              WHEN 'i' THEN 'initial ACL'
              WHEN 'o' THEN 'ownership'
              WHEN 'r' THEN 'policy reference'
            END AS kind,
            pg_describe_object(
              dependency.classid,
              dependency.objid,
              dependency.objsubid
            ) AS object
     FROM pg_shdepend dependency
     CROSS JOIN runtime_role
     CROSS JOIN current_database_object
     WHERE dependency.refclassid = 'pg_authid'::regclass
       AND dependency.refobjid = runtime_role.oid
       AND dependency.dbid IN (0, current_database_object.oid)
       AND dependency.deptype IN ('a', 'i', 'o', 'r')
       AND NOT (
         dependency.deptype = 'a'
         AND dependency.classid = 'pg_database'::regclass
         AND dependency.objid = current_database_object.oid
         AND dependency.objsubid = 0
         AND EXISTS (
           SELECT 1
           FROM aclexplode(current_database_object.datacl) acl
           WHERE acl.grantee = runtime_role.oid
             AND acl.privilege_type = 'CONNECT'
             AND NOT acl.is_grantable
         )
         AND NOT EXISTS (
           SELECT 1
           FROM aclexplode(current_database_object.datacl) acl
           WHERE acl.grantee = runtime_role.oid
             AND (
               acl.privilege_type <> 'CONNECT'
               OR acl.is_grantable
             )
         )
       )
     ORDER BY kind, object`,
    [validated],
  );
  return result.rows;
}

async function ensureLoginPrivilegeBoundary(
  client: PoolClient,
  login: string,
  requirements: LoginRoleRequirements,
): Promise<void> {
  const unexpectedDependencies = await findUnexpectedRoleDependencies(client, login);
  if (unexpectedDependencies.length > 0) {
    throw new Error(
      `Configured ${requirements.loginDescription} "${login}" has direct privileges, ownership, or policy references outside its ${requirements.assignedRoleDescription}: ${unexpectedDependencies.map(({ kind, object }) => `${object} (${kind})`).join(', ')}`,
    );
  }
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

async function ensureExistingLoginRole(
  client: PoolClient,
  role: string,
  assignedRole: string,
  requirements: LoginRoleRequirements = RUNTIME_LOGIN_REQUIREMENTS,
): Promise<void> {
  const validated = assertPostgresIdentifier(role, requirements.loginDescription);
  const validatedAssignedRole = assertPostgresIdentifier(assignedRole, 'database role');
  const existing = await readRoleAttributes(client, validated);
  if (existing == null) {
    throw new Error(`Configured ${requirements.loginDescription} "${validated}" does not exist`);
  }
  if (!existing.canLogin || hasElevatedCapabilities(existing)) {
    throw new Error(
      `Configured ${requirements.loginDescription} "${validated}" must be LOGIN, NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOREPLICATION, and NOBYPASSRLS`,
    );
  }
  const unexpectedRoles = (await readReachableRoles(client, validated)).filter(
    (reachableRole) => reachableRole !== validatedAssignedRole,
  );
  if (unexpectedRoles.length > 0) {
    throw new Error(
      `Configured ${requirements.loginDescription} "${validated}" must not be a member of roles other than "${validatedAssignedRole}": ${unexpectedRoles.join(', ')}`,
    );
  }
  await ensureMembershipOptions(client, validated, validatedAssignedRole, requirements);
  await ensureLoginPrivilegeBoundary(client, validated, requirements);
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
    } else {
      await client.query(
        `CREATE TYPE ${quotePostgresIdentifier(SHARED_SCHEMA)}.${quotePostgresIdentifier(name)} AS ENUM (${values.map(quotePostgresLiteral).join(', ')})`,
      );
    }
    await client.query(
      `REVOKE USAGE ON TYPE ${quotePostgresIdentifier(SHARED_SCHEMA)}.${quotePostgresIdentifier(name)} FROM PUBLIC`,
    );
  }
  await client.query('RESET ROLE');
}

async function findUnexpectedApiRelations(
  client: PoolClient,
  viewNames: readonly string[],
): Promise<RelationInventoryRow[]> {
  const result = await client.query<RelationInventoryRow>(
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

async function findUnexpectedApiRoutines(client: PoolClient): Promise<RoutineInventoryRow[]> {
  const result = await client.query<RoutineInventoryRow>(
    `SELECT CASE routine.prokind
              WHEN 'a' THEN 'aggregate'
              WHEN 'f' THEN 'function'
              WHEN 'p' THEN 'procedure'
              WHEN 'w' THEN 'window function'
            END AS kind,
            routine.proname || '(' || pg_get_function_identity_arguments(routine.oid) || ')' AS signature
     FROM pg_proc routine
     JOIN pg_namespace namespace ON namespace.oid = routine.pronamespace
     WHERE namespace.nspname = $1
     ORDER BY routine.proname, pg_get_function_identity_arguments(routine.oid)`,
    [API_SCHEMA],
  );
  return result.rows;
}

async function ensureApiSchemaInventory(
  client: PoolClient,
  viewNames: readonly string[],
): Promise<void> {
  const unexpectedRelations = await findUnexpectedApiRelations(client, viewNames);
  if (unexpectedRelations.length > 0) {
    throw new Error(
      `API schema contains unexpected relations: ${unexpectedRelations.map(({ kind, name }) => `${name} (${kind})`).join(', ')}`,
    );
  }
  const unexpectedRoutines = await findUnexpectedApiRoutines(client);
  if (unexpectedRoutines.length > 0) {
    throw new Error(
      `API schema contains unexpected routines: ${unexpectedRoutines.map(({ kind, signature }) => `${signature} (${kind})`).join(', ')}`,
    );
  }
}

async function revokePublicApiViewTypeUsage(
  client: PoolClient,
  viewNames: readonly string[],
): Promise<void> {
  const existingViews = await client.query<RelationInventoryRow>(
    `SELECT relation.relkind AS kind, relation.relname AS name
     FROM pg_class relation
     JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
     WHERE namespace.nspname = $1
       AND relation.relkind = 'v'
       AND relation.relname = ANY($2::text[])
     ORDER BY relation.relname`,
    [API_SCHEMA, viewNames],
  );
  if (existingViews.rows.length === 0) return;

  await client.query(`SET LOCAL ROLE ${quotePostgresIdentifier(API_OWNER_ROLE)}`);
  for (const { name } of existingViews.rows) {
    await client.query(
      `REVOKE USAGE ON TYPE ${quotePostgresIdentifier(API_SCHEMA)}.${quotePostgresIdentifier(name)} FROM PUBLIC`,
    );
  }
  await client.query('RESET ROLE');
}

async function findUnexpectedSharedObjects(client: PoolClient): Promise<SharedObjectRow[]> {
  const result = await client.query<SharedObjectRow>(
    `WITH shared_namespace AS (
       SELECT oid FROM pg_namespace WHERE nspname = $1
     ), expected_enums AS (
       SELECT shared_type.oid
       FROM pg_type shared_type
       WHERE shared_type.typnamespace = (SELECT oid FROM shared_namespace)
         AND shared_type.typtype = 'e'
         AND shared_type.typname = ANY($2::text[])
     )
     SELECT 'relation ' || shared_relation.relkind::text AS kind, shared_relation.relname AS name
     FROM pg_class shared_relation
     WHERE shared_relation.relnamespace = (SELECT oid FROM shared_namespace)
     UNION ALL
     SELECT CASE shared_routine.prokind
              WHEN 'a' THEN 'aggregate'
              WHEN 'f' THEN 'function'
              WHEN 'p' THEN 'procedure'
              WHEN 'w' THEN 'window function'
            END AS kind,
            shared_routine.proname || '(' || pg_get_function_identity_arguments(shared_routine.oid) || ')' AS name
     FROM pg_proc shared_routine
     WHERE shared_routine.pronamespace = (SELECT oid FROM shared_namespace)
     UNION ALL
     SELECT 'type ' || shared_type.typtype::text AS kind, shared_type.typname AS name
     FROM pg_type shared_type
     WHERE shared_type.typnamespace = (SELECT oid FROM shared_namespace)
       AND shared_type.oid NOT IN (SELECT oid FROM expected_enums)
       AND shared_type.typelem NOT IN (SELECT oid FROM expected_enums)
     UNION ALL
     SELECT 'operator' AS kind, custom_operator.oprname AS name
     FROM pg_operator custom_operator
     WHERE custom_operator.oprnamespace = (SELECT oid FROM shared_namespace)
     UNION ALL
     SELECT 'operator class' AS kind, shared_operator_class.opcname AS name
     FROM pg_opclass shared_operator_class
     WHERE shared_operator_class.opcnamespace = (SELECT oid FROM shared_namespace)
     UNION ALL
     SELECT 'operator family' AS kind, shared_operator_family.opfname AS name
     FROM pg_opfamily shared_operator_family
     WHERE shared_operator_family.opfnamespace = (SELECT oid FROM shared_namespace)
     UNION ALL
     SELECT 'collation' AS kind, shared_collation.collname AS name
     FROM pg_collation shared_collation
     WHERE shared_collation.collnamespace = (SELECT oid FROM shared_namespace)
     UNION ALL
     SELECT 'conversion' AS kind, shared_conversion.conname AS name
     FROM pg_conversion shared_conversion
     WHERE shared_conversion.connamespace = (SELECT oid FROM shared_namespace)
     UNION ALL
     SELECT 'text search configuration' AS kind, shared_configuration.cfgname AS name
     FROM pg_ts_config shared_configuration
     WHERE shared_configuration.cfgnamespace = (SELECT oid FROM shared_namespace)
     UNION ALL
     SELECT 'text search dictionary' AS kind, shared_dictionary.dictname AS name
     FROM pg_ts_dict shared_dictionary
     WHERE shared_dictionary.dictnamespace = (SELECT oid FROM shared_namespace)
     UNION ALL
     SELECT 'text search parser' AS kind, shared_parser.prsname AS name
     FROM pg_ts_parser shared_parser
     WHERE shared_parser.prsnamespace = (SELECT oid FROM shared_namespace)
     UNION ALL
     SELECT 'text search template' AS kind, shared_template.tmplname AS name
     FROM pg_ts_template shared_template
     WHERE shared_template.tmplnamespace = (SELECT oid FROM shared_namespace)
     UNION ALL
     SELECT 'extended statistic' AS kind, shared_statistic.stxname AS name
     FROM pg_statistic_ext shared_statistic
     WHERE shared_statistic.stxnamespace = (SELECT oid FROM shared_namespace)
     ORDER BY kind, name`,
    [SHARED_SCHEMA, Object.keys(SHARED_ENUMS)],
  );
  return result.rows;
}

async function ensureSharedSchemaInventory(client: PoolClient): Promise<void> {
  const unexpectedObjects = await findUnexpectedSharedObjects(client);
  if (unexpectedObjects.length > 0) {
    throw new Error(
      `Shared schema "${SHARED_SCHEMA}" contains unexpected objects: ${unexpectedObjects.map(({ kind, name }) => `${name} (${kind})`).join(', ')}`,
    );
  }
}

async function findUnexpectedReaderPrivileges(
  client: PoolClient,
  viewNames: readonly string[],
): Promise<ReaderPrivilegeRow[]> {
  const result = await client.query<ReaderPrivilegeRow>(
    `WITH reader AS (
       SELECT oid FROM pg_roles WHERE rolname = $1
     ), privileges AS (
       SELECT CASE WHEN acl.grantee = 0 THEN 'PUBLIC' ELSE $1 END AS grantee,
              'schema' AS kind,
              format('%I', namespace.nspname) AS object,
              acl.privilege_type AS privilege
       FROM pg_namespace namespace
       CROSS JOIN LATERAL aclexplode(namespace.nspacl) acl
       CROSS JOIN reader
       WHERE (acl.grantee = reader.oid OR acl.grantee = 0)
         AND NOT (
           (
             acl.grantee = reader.oid
             AND namespace.nspname IN ($2, $3)
             AND acl.privilege_type = 'USAGE'
             AND NOT acl.is_grantable
           )
           OR (
             acl.grantee = 0
             AND (
               namespace.nspname IN ('public', 'pg_catalog', 'information_schema')
               OR namespace.nspname LIKE 'pg_toast%'
               OR namespace.nspname LIKE 'pg_temp_%'
             )
             AND acl.privilege_type = 'USAGE'
             AND NOT acl.is_grantable
           )
         )
       UNION ALL
       SELECT CASE WHEN acl.grantee = 0 THEN 'PUBLIC' ELSE $1 END AS grantee,
              'relation' AS kind,
              format('%I.%I', namespace.nspname, relation.relname) AS object,
              acl.privilege_type AS privilege
       FROM pg_class relation
       JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
       CROSS JOIN LATERAL aclexplode(relation.relacl) acl
       CROSS JOIN reader
       WHERE (acl.grantee = reader.oid OR acl.grantee = 0)
         AND NOT (
           (
             acl.grantee = reader.oid
             AND namespace.nspname = $2
             AND relation.relkind = 'v'
             AND relation.relname = ANY($4::text[])
             AND acl.privilege_type = 'SELECT'
             AND NOT acl.is_grantable
           )
           OR (
             acl.grantee = 0
             AND (
               namespace.nspname IN ('pg_catalog', 'information_schema')
               OR namespace.nspname LIKE 'pg_toast%'
               OR namespace.nspname LIKE 'pg_temp_%'
             )
           )
         )
       UNION ALL
       SELECT CASE WHEN acl.grantee = 0 THEN 'PUBLIC' ELSE $1 END AS grantee,
              'column' AS kind,
              format('%I.%I.%I', namespace.nspname, relation.relname, attribute.attname) AS object,
              acl.privilege_type AS privilege
       FROM pg_attribute attribute
       JOIN pg_class relation ON relation.oid = attribute.attrelid
       JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
       CROSS JOIN LATERAL aclexplode(attribute.attacl) acl
       CROSS JOIN reader
       WHERE (acl.grantee = reader.oid OR acl.grantee = 0)
         AND NOT (
           acl.grantee = 0
           AND (
             namespace.nspname IN ('pg_catalog', 'information_schema')
             OR namespace.nspname LIKE 'pg_toast%'
             OR namespace.nspname LIKE 'pg_temp_%'
           )
         )
       UNION ALL
       SELECT CASE WHEN acl.grantee = 0 THEN 'PUBLIC' ELSE $1 END AS grantee,
              'routine' AS kind,
              format('%I.%I(%s)', namespace.nspname, routine.proname, pg_get_function_identity_arguments(routine.oid)) AS object,
              acl.privilege_type AS privilege
       FROM pg_proc routine
       JOIN pg_namespace namespace ON namespace.oid = routine.pronamespace
       CROSS JOIN LATERAL aclexplode(
         COALESCE(routine.proacl, acldefault('f', routine.proowner))
       ) acl
       CROSS JOIN reader
       WHERE (acl.grantee = reader.oid OR acl.grantee = 0)
         AND (
           acl.grantee = reader.oid
           OR (
             namespace.nspname NOT IN ('pg_catalog', 'information_schema')
             AND namespace.nspname NOT LIKE 'pg_toast%'
             AND namespace.nspname NOT LIKE 'pg_temp_%'
             AND has_schema_privilege(reader.oid, namespace.oid, 'USAGE')
           )
         )
       UNION ALL
       SELECT CASE WHEN acl.grantee = 0 THEN 'PUBLIC' ELSE $1 END AS grantee,
              'type' AS kind,
              format('%I.%I', namespace.nspname, granted_type.typname) AS object,
              acl.privilege_type AS privilege
       FROM pg_type granted_type
       JOIN pg_namespace namespace ON namespace.oid = granted_type.typnamespace
       CROSS JOIN LATERAL aclexplode(
         COALESCE(granted_type.typacl, acldefault('T', granted_type.typowner))
       ) acl
       CROSS JOIN reader
       WHERE granted_type.typelem = 0
         AND (acl.grantee = reader.oid OR acl.grantee = 0)
         AND (
           acl.grantee = reader.oid
           OR (
             namespace.nspname NOT IN ('pg_catalog', 'information_schema')
             AND namespace.nspname NOT LIKE 'pg_toast%'
             AND namespace.nspname NOT LIKE 'pg_temp_%'
             AND has_schema_privilege(reader.oid, namespace.oid, 'USAGE')
           )
         )
         AND NOT (
           acl.grantee = reader.oid
           AND namespace.nspname = $3
           AND granted_type.typtype = 'e'
           AND granted_type.typname = ANY($5::text[])
           AND acl.privilege_type = 'USAGE'
           AND NOT acl.is_grantable
         )
       UNION ALL
       SELECT CASE WHEN acl.grantee = 0 THEN 'PUBLIC' ELSE $1 END AS grantee,
              'database' AS kind,
              format('%I', database.datname) AS object,
              acl.privilege_type AS privilege
       FROM pg_database database
       CROSS JOIN LATERAL aclexplode(
         COALESCE(database.datacl, acldefault('d', database.datdba))
       ) acl
       CROSS JOIN reader
       WHERE (acl.grantee = reader.oid OR acl.grantee = 0)
         AND NOT (
           acl.grantee = 0
           AND acl.privilege_type IN ('CONNECT', 'TEMPORARY')
           AND NOT acl.is_grantable
         )
       UNION ALL
       SELECT CASE WHEN acl.grantee = 0 THEN 'PUBLIC' ELSE $1 END AS grantee,
              'default privilege' AS kind,
              format('%s:%s:%s', owner.rolname, COALESCE(namespace.nspname, '<global>'), default_acl.defaclobjtype) AS object,
              acl.privilege_type AS privilege
       FROM pg_default_acl default_acl
       JOIN pg_roles owner ON owner.oid = default_acl.defaclrole
       LEFT JOIN pg_namespace namespace ON namespace.oid = default_acl.defaclnamespace
       CROSS JOIN LATERAL aclexplode(default_acl.defaclacl) acl
       CROSS JOIN reader
       WHERE acl.grantee = reader.oid OR acl.grantee = 0
       UNION ALL
       SELECT $1 AS grantee,
              'schema' AS kind,
              format('%I', namespace.nspname) AS object,
              'OWNER' AS privilege
       FROM pg_namespace namespace
       JOIN reader ON reader.oid = namespace.nspowner
       UNION ALL
       SELECT $1 AS grantee,
              'relation' AS kind,
              format('%I.%I', namespace.nspname, relation.relname) AS object,
              'OWNER' AS privilege
       FROM pg_class relation
       JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
       JOIN reader ON reader.oid = relation.relowner
       UNION ALL
       SELECT $1 AS grantee,
              'routine' AS kind,
              format('%I.%I(%s)', namespace.nspname, routine.proname, pg_get_function_identity_arguments(routine.oid)) AS object,
              'OWNER' AS privilege
       FROM pg_proc routine
       JOIN pg_namespace namespace ON namespace.oid = routine.pronamespace
       JOIN reader ON reader.oid = routine.proowner
       UNION ALL
       SELECT $1 AS grantee,
              'type' AS kind,
              format('%I.%I', namespace.nspname, owned_type.typname) AS object,
              'OWNER' AS privilege
       FROM pg_type owned_type
       JOIN pg_namespace namespace ON namespace.oid = owned_type.typnamespace
       JOIN reader ON reader.oid = owned_type.typowner
       UNION ALL
       SELECT $1 AS grantee,
              'database' AS kind,
              format('%I', database.datname) AS object,
              'OWNER' AS privilege
       FROM pg_database database
       JOIN reader ON reader.oid = database.datdba
     )
     SELECT grantee, kind, object, privilege
     FROM privileges
     ORDER BY kind, object, privilege, grantee`,
    [API_READER_ROLE, API_SCHEMA, SHARED_SCHEMA, viewNames, Object.keys(SHARED_ENUMS)],
  );
  return result.rows;
}

async function ensureReaderPrivilegeBoundary(client: PoolClient): Promise<void> {
  const unexpectedPrivileges = await findUnexpectedReaderPrivileges(
    client,
    publicTables.map(getTableName),
  );
  if (unexpectedPrivileges.length > 0) {
    throw new Error(
      `API reader role "${API_READER_ROLE}" has privileges outside the approved API boundary: ${unexpectedPrivileges.map(({ grantee, kind, object, privilege }) => `${object} (${kind} ${privilege} via ${grantee})`).join(', ')}`,
    );
  }
}

async function prepareRolesAndSchemas(
  client: PoolClient,
  networks: readonly DatabaseMigrationNetwork[],
  apiLogin?: string,
): Promise<void> {
  await client.query('BEGIN');
  try {
    const currentConnectionResult = await client.query<CurrentConnectionRow>(
      'SELECT current_database() AS "currentDatabase", current_user AS "currentUser"',
    );
    const currentConnection = currentConnectionResult.rows[0];
    if (currentConnection == null) {
      throw new Error('PostgreSQL did not return the current database and user');
    }
    const { currentDatabase, currentUser } = currentConnection;
    assertPostgresIdentifier(currentUser, 'migration admin role');

    await ensureNoLoginRole(client, API_OWNER_ROLE);
    await ensureNoLoginRole(client, API_READER_ROLE);
    await client.query(
      `GRANT ${quotePostgresIdentifier(API_OWNER_ROLE)} TO ${quotePostgresIdentifier(currentUser)}`,
    );
    await ensureExclusiveRoleMembers(client, API_OWNER_ROLE, [currentUser], 'API owner role');
    await ensureOwnedSchema(client, API_SCHEMA, API_OWNER_ROLE);
    await ensureOwnedSchema(client, SHARED_SCHEMA, API_OWNER_ROLE);
    await ensureSharedEnums(client);
    await ensureSharedSchemaInventory(client);
    await ensureApiSchemaInventory(client, publicTables.map(getTableName));
    await revokePublicApiViewTypeUsage(client, publicTables.map(getTableName));
    await ensureReaderPrivilegeBoundary(client);
    await client.query(
      `GRANT USAGE ON SCHEMA ${quotePostgresIdentifier(SHARED_SCHEMA)} TO ${quotePostgresIdentifier(API_READER_ROLE)}`,
    );
    if (apiLogin != null) {
      await ensureExistingLoginRole(client, apiLogin, API_READER_ROLE, API_LOGIN_REQUIREMENTS);
    }
    await ensureExclusiveRoleMembers(
      client,
      API_READER_ROLE,
      apiLogin == null ? [] : [apiLogin],
      'API reader role',
    );
    if (apiLogin != null) {
      await client.query(
        `GRANT ${quotePostgresIdentifier(API_READER_ROLE)} TO ${quotePostgresIdentifier(apiLogin)} WITH ADMIN FALSE, INHERIT TRUE, SET FALSE`,
      );
      await ensureMembershipOptions(client, apiLogin, API_READER_ROLE, API_LOGIN_REQUIREMENTS);
      await client.query(
        `ALTER ROLE ${quotePostgresIdentifier(apiLogin)} IN DATABASE ${escapeIdentifier(currentDatabase)} SET search_path TO ${quotePostgresIdentifier(API_SCHEMA)}, ${quotePostgresIdentifier(SHARED_SCHEMA)}, ${quotePostgresIdentifier('public')}`,
      );
    }

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
      await normalizeChainRoutinePrivileges(client, network.role, network.schema);
      await ensureWriterRolePrivilegeBoundary(client, network.role, network.schema);
      if (network.runtimeLogin != null) {
        await ensureExistingLoginRole(client, network.runtimeLogin, network.role);
      }
      await ensureExclusiveRoleMembers(
        client,
        network.role,
        [currentUser, ...(network.runtimeLogin == null ? [] : [network.runtimeLogin])],
        'Database writer role',
      );
      if (network.runtimeLogin != null) {
        await client.query(
          `GRANT ${quotePostgresIdentifier(network.role)} TO ${quotePostgresIdentifier(network.runtimeLogin)}`,
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
  hasDestructiveReplayMigration: boolean,
): Promise<void> {
  if (!hasAppliedMigrations || !hasPendingMigrations) return;
  const tables = await client.query<TableNameRow>(
    `SELECT tablename AS "tableName"
     FROM pg_tables
     WHERE schemaname = $1 AND right(tablename, 11) = '__snapshots'
     ORDER BY tablename`,
    [networkSchema],
  );
  if (tables.rows.length > 0 && !hasDestructiveReplayMigration) {
    throw new Error(
      `Pending schema migrations cannot run in "${networkSchema}" while rollback snapshot artifacts exist. Rebuild the alpha database or use an owner-approved snapshot-preserving procedure.`,
    );
  }
}

function containsDestructiveReplayMigration(
  migrations: ReturnType<typeof readMigrationFiles>,
): boolean {
  return migrations.some(({ sql: statements }) =>
    statements.some((statement) => statement.trimStart().startsWith(DESTRUCTIVE_REPLAY_MARKER)),
  );
}

function findDuplicates(values: readonly (number | string)[]): string[] {
  const seen = new Set<number | string>();
  const duplicates = new Set<number | string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates].map(String).sort();
}

function assertMigrationNetworks(networks: readonly DatabaseMigrationNetwork[]): void {
  if (networks.length === 0) throw new Error('At least one migration network is required');
  const dimensions: { label: string; values: (number | string)[] }[] = [
    { label: 'network keys', values: networks.map(({ network }) => network.key) },
    { label: 'chain IDs', values: networks.map(({ network }) => network.chainId) },
    { label: 'schemas', values: networks.map(({ schema }) => schema) },
    { label: 'writer roles', values: networks.map(({ role }) => role) },
    {
      label: 'runtime logins',
      values: networks.flatMap(({ runtimeLogin }) => (runtimeLogin == null ? [] : [runtimeLogin])),
    },
  ];
  for (const { label, values } of dimensions) {
    const duplicates = findDuplicates(values);
    if (duplicates.length > 0) {
      throw new Error(`Migration networks contain duplicate ${label}: ${duplicates.join(', ')}`);
    }
  }

  for (const network of networks) {
    const catalogNetwork = getNetworkConfig(network.network.key);
    if (network.network.chainId !== catalogNetwork.chainId) {
      throw new Error(
        `Migration network "${network.network.key}" must use catalog chain ID ${catalogNetwork.chainId}; received ${network.network.chainId}`,
      );
    }
    const expectedSchema = assertPostgresIdentifier(
      createNetworkSchema(network.network.key),
      'canonical network schema',
    );
    const configuredSchema = assertPostgresIdentifier(network.schema, 'migration network schema');
    if (RESERVED_MIGRATION_SCHEMAS.has(configuredSchema)) {
      throw new Error(
        `Migration network "${network.network.key}" must not use reserved schema "${configuredSchema}"`,
      );
    }
    if (configuredSchema !== expectedSchema) {
      throw new Error(
        `Migration network "${network.network.key}" must use canonical schema "${expectedSchema}"; received "${configuredSchema}"`,
      );
    }

    const expectedRole = createNetworkDatabaseRole(expectedSchema);
    const configuredRole = assertPostgresIdentifier(network.role, 'migration network writer role');
    if (RESERVED_MIGRATION_ROLES.has(configuredRole)) {
      throw new Error(
        `Migration network "${network.network.key}" must not use reserved writer role "${configuredRole}"`,
      );
    }
    if (configuredRole !== expectedRole) {
      throw new Error(
        `Migration network "${network.network.key}" must use canonical writer role "${expectedRole}"; received "${configuredRole}"`,
      );
    }
    if (network.runtimeLogin != null) {
      assertPostgresIdentifier(network.runtimeLogin, 'migration network runtime login');
    }
  }
}

async function assertExpectedNetworkIdentity(
  client: PoolClient,
  network: DatabaseMigrationNetwork,
): Promise<void> {
  const tableExists = await client.query<TableExistsRow>(
    `SELECT EXISTS (
       SELECT 1
       FROM pg_class relation
       JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
       WHERE namespace.nspname = $1
         AND relation.relname = 'network_config'
         AND relation.relkind IN ('r', 'p')
     ) AS exists`,
    [network.schema],
  );
  if (tableExists.rows[0]?.exists !== true) return;

  const qualifiedTable = `${quotePostgresIdentifier(network.schema)}.${quotePostgresIdentifier('network_config')}`;
  const result = await client.query<NetworkIdentityRow>(
    `SELECT network, chain_id::text AS "chainId" FROM ${qualifiedTable} ORDER BY network, chain_id`,
  );
  const expectedChainId = String(network.network.chainId);
  if (
    result.rows.length > 1 ||
    (result.rows[0] != null &&
      (result.rows[0].network !== network.network.key ||
        result.rows[0].chainId !== expectedChainId))
  ) {
    const actual = result.rows
      .map(({ chainId, network: storedNetwork }) => `${storedNetwork}:${chainId}`)
      .join(', ');
    throw new Error(
      `Network schema "${network.schema}" contains unexpected identities: ${actual}; expected only ${network.network.key}:${expectedChainId}`,
    );
  }
}

async function migrateNetwork(
  client: PoolClient,
  network: DatabaseMigrationNetwork,
  migrationsDirectory: string,
): Promise<void> {
  await client.query(`SET LOCAL ROLE ${quotePostgresIdentifier(network.role)}`);
  await client.query(
    `SET LOCAL search_path TO ${quotePostgresIdentifier(network.schema)}, ${quotePostgresIdentifier(SHARED_SCHEMA)}, ${quotePostgresIdentifier('public')}`,
  );
  await assertExpectedNetworkIdentity(client, network);
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
  if (appliedResult.rows.length > 0) {
    await ensureChainObjectOwnership(client, network.role, network.schema, false);
  }
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

  const pendingMigrations = migrations.slice(appliedResult.rows.length);

  await assertSnapshotEvolutionSafe(
    client,
    network.schema,
    appliedResult.rows.length > 0,
    pendingMigrations.length > 0,
    containsDestructiveReplayMigration(pendingMigrations),
  );

  await db.execute(
    sql`SELECT pg_advisory_xact_lock(hashtext(${`lsp-indexer-v3:migrations:${network.schema}`})::bigint)`,
  );
  for (const migration of pendingMigrations) {
    for (const statement of migration.sql) {
      if (statement.trim().length > 0) await db.execute(sql.raw(statement));
    }
    await db.execute(sql`
          INSERT INTO ${sql.raw(migrationTable)} (hash, created_at)
          VALUES (${migration.hash}, ${migration.folderMillis})
        `);
  }
  await assertExpectedNetworkIdentity(client, network);
  await ensureChainObjectOwnership(client, network.role, network.schema);
  await ensureChainSchemaFingerprint(client, network.schema);
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
  for (const { columns, table } of API_VIEW_DEPENDENCY_COLUMNS) {
    await client.query(
      `GRANT SELECT (${columns.map(quotePostgresIdentifier).join(', ')}) ON ${quotePostgresIdentifier(table)} TO ${quotePostgresIdentifier(API_OWNER_ROLE)}`,
    );
  }
  await ensureChainAclBoundary(client, network.role, network.schema);
  await verifyMigrationHistory(client, network.schema, migrationsDirectory);
  await client.query('RESET ROLE');
  await client.query(`SET LOCAL search_path TO ${quotePostgresIdentifier('public')}`);
}

async function dropApiViews(client: PoolClient): Promise<void> {
  await client.query(`SET LOCAL ROLE ${quotePostgresIdentifier(API_OWNER_ROLE)}`);
  for (const viewName of publicTables.map(getTableName)) {
    await client.query(
      `DROP VIEW IF EXISTS ${quotePostgresIdentifier(API_SCHEMA)}.${quotePostgresIdentifier(viewName)}`,
    );
  }
  await client.query('RESET ROLE');
}

function createApiViewSelection(network: DatabaseMigrationNetwork, viewName: string): string {
  const schemaName = quotePostgresIdentifier(network.schema);
  const tableName = quotePostgresIdentifier(viewName);
  if (viewName !== 'metadata_revisions') {
    return `SELECT * FROM ${schemaName}.${tableName}`;
  }

  return `SELECT revision.*,
                 EXISTS (
                   SELECT 1
                   FROM ${schemaName}.${quotePostgresIdentifier('metadata_jobs')} current_job
                   WHERE current_job.id = revision.id
                     AND current_job.status <> 'cancelled'
                 ) AS is_current
          FROM ${schemaName}.${tableName} revision`;
}

async function rebuildApiViews(
  client: PoolClient,
  networks: readonly DatabaseMigrationNetwork[],
): Promise<string[]> {
  const viewNames = publicTables.map(getTableName);
  await client.query(`SET LOCAL ROLE ${quotePostgresIdentifier(API_OWNER_ROLE)}`);
  await client.query(
    `SET LOCAL search_path TO ${quotePostgresIdentifier(API_SCHEMA)}, ${quotePostgresIdentifier(SHARED_SCHEMA)}, ${quotePostgresIdentifier('public')}`,
  );
  for (const viewName of viewNames) {
    await client.query(
      `DROP VIEW IF EXISTS ${quotePostgresIdentifier(API_SCHEMA)}.${quotePostgresIdentifier(viewName)}`,
    );
  }
  for (const viewName of viewNames) {
    const view = quotePostgresIdentifier(viewName);
    const selections = networks
      .map((network) => createApiViewSelection(network, viewName))
      .join(' UNION ALL ');
    await client.query(
      `CREATE VIEW ${quotePostgresIdentifier(API_SCHEMA)}.${view} WITH (security_barrier = true) AS ${selections}`,
    );
    await client.query(
      `REVOKE USAGE ON TYPE ${quotePostgresIdentifier(API_SCHEMA)}.${view} FROM PUBLIC`,
    );
  }
  await ensureApiSchemaInventory(client, viewNames);
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
  await client.query(
    `GRANT USAGE ON SCHEMA ${quotePostgresIdentifier(API_SCHEMA)} TO ${quotePostgresIdentifier(API_READER_ROLE)}`,
  );
  await client.query('RESET ROLE');
  await client.query(`SET LOCAL search_path TO ${quotePostgresIdentifier('public')}`);
  return viewNames;
}

/** Apply one migration series to every chain schema and atomically rebuild unified API views. */
export async function migrateDatabaseWithPool(
  pool: Pool,
  config: DatabaseMigrationConfig,
  options: DatabaseMigrationOptions = {},
): Promise<DatabaseMigrationResult> {
  assertMigrationNetworks(config.networks);
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

    await prepareRolesAndSchemas(client, config.networks, config.apiLogin);
    for (const network of config.networks) {
      await ensureCurrentChainTableOwnership(client, network, migrationsDirectory);
    }
    for (const network of config.networks) {
      await ensureChainAclBoundary(client, network.role, network.schema);
    }
    await client.query('BEGIN');
    try {
      await dropApiViews(client);
      for (const network of config.networks) {
        await migrateNetwork(client, network, migrationsDirectory);
      }
      const publicViews = await rebuildApiViews(client, config.networks);
      await client.query('COMMIT');
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
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
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
