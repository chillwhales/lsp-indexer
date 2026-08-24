import { sql } from 'drizzle-orm';
import { getNetworkKeys, type RuntimeConfig } from '../config/index.js';
import type { NetworkDatabase } from './client.js';
import { DATABASE_SCHEMA_VERSION, SHARED_SCHEMA, createNetworkDatabaseRole } from './names.js';
import {
  createChainObjectOwnershipQuery,
  createWriterRoleBoundaryQuery,
  formatChainObjectOwnership,
  type ChainObjectOwnershipRow,
} from './roleBoundary.js';

interface DatabaseIdentityRow extends Record<string, unknown> {
  currentRole: string;
  currentSchema: string | null;
  sessionUser: string;
  sessionUserIsSuperuser: boolean;
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

interface ReachableRoleRow extends Record<string, unknown> {
  role: string;
}

interface RoleDependencyRow extends Record<string, unknown> {
  kind: string;
  object: string;
}

export interface DatabaseReadiness {
  currentRole: string;
  currentSchema: string;
  searchPath: string;
  network: string;
  chainId: number;
  schemaVersion: number;
}

/** Verify role, search path, seed identity, and credential isolation at startup. */
export async function verifyDatabaseReadiness(
  db: NetworkDatabase,
  runtime: RuntimeConfig,
): Promise<DatabaseReadiness> {
  const identity = await db.execute<DatabaseIdentityRow>(sql`
    SELECT current_role AS "currentRole",
           current_schema() AS "currentSchema",
           session_user AS "sessionUser",
           COALESCE(
             (SELECT rolsuper FROM pg_roles WHERE rolname = session_user),
             false
           ) AS "sessionUserIsSuperuser",
           current_setting('search_path') AS "searchPath",
           current_schemas(false)::text[] AS "searchPathSchemas"
  `);
  const row = identity.rows[0];
  if (row == null) throw new Error('PostgreSQL did not return connection identity');

  const expectedRole = createNetworkDatabaseRole(runtime.databaseSchema);
  if (row.currentRole !== expectedRole) {
    throw new Error(`Database role is "${row.currentRole}"; expected "${expectedRole}"`);
  }
  if (row.sessionUserIsSuperuser) {
    throw new Error(`Database session user "${row.sessionUser}" must not be a superuser`);
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
  const membershipResult = await db.execute<ReachableRoleRow>(sql`
    WITH RECURSIVE memberships(role_id) AS (
      SELECT membership.roleid
      FROM pg_auth_members membership
      JOIN pg_roles member_role ON member_role.oid = membership.member
      WHERE member_role.rolname = session_user
      UNION
      SELECT membership.roleid
      FROM pg_auth_members membership
      JOIN memberships inherited ON inherited.role_id = membership.member
    )
    SELECT role.rolname AS role
    FROM memberships
    JOIN pg_roles role ON role.oid = memberships.role_id
    WHERE role.rolname <> ${expectedRole}
    ORDER BY role.rolname
  `);
  if (membershipResult.rows.length > 0) {
    throw new Error(
      `Database session user can assume roles outside "${expectedRole}": ${membershipResult.rows.map(({ role }) => role).join(', ')}`,
    );
  }
  const directPrivilegeResult = await db.execute<RoleDependencyRow>(sql`
    WITH runtime_role AS (
      SELECT oid FROM pg_roles WHERE rolname = session_user
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
    ORDER BY kind, object
  `);
  if (directPrivilegeResult.rows.length > 0) {
    throw new Error(
      `Database session user "${row.sessionUser}" has direct privileges, ownership, or policy references outside its writer role: ${directPrivilegeResult.rows.map(({ kind, object }) => `${object} (${kind})`).join(', ')}`,
    );
  }
  const writerPrivilegeResult = await db.execute<RoleDependencyRow>(
    createWriterRoleBoundaryQuery(expectedRole, runtime.databaseSchema),
  );
  if (writerPrivilegeResult.rows.length > 0) {
    throw new Error(
      `Database writer role "${expectedRole}" has privileges, ownership, default privileges, or policy references outside assigned schema "${runtime.databaseSchema}": ${writerPrivilegeResult.rows.map(({ kind, object }) => `${object} (${kind})`).join(', ')}`,
    );
  }
  const ownershipResult = await db.execute<ChainObjectOwnershipRow>(
    createChainObjectOwnershipQuery(expectedRole, runtime.databaseSchema),
  );
  if (ownershipResult.rows.length > 0) {
    throw new Error(
      `Database writer role "${expectedRole}" must own every expected object in schema "${runtime.databaseSchema}": ${formatChainObjectOwnership(ownershipResult.rows)}`,
    );
  }
  const privilegeResult = await db.execute<ForeignWritePrivilegeRow>(sql`
    WITH RECURSIVE reachable_roles(role_id) AS (
      SELECT oid
      FROM pg_roles
      WHERE rolname = session_user
      UNION
      SELECT membership.roleid
      FROM pg_auth_members membership
      JOIN reachable_roles reachable ON reachable.role_id = membership.member
    )
    SELECT DISTINCT namespace.nspname AS schema
    FROM pg_namespace namespace
    CROSS JOIN reachable_roles reachable
    WHERE namespace.nspname IN (${foreignSchemaList})
      AND (
        has_schema_privilege(reachable.role_id, namespace.oid, 'CREATE')
        OR EXISTS (
          SELECT 1
          FROM pg_class relation
          WHERE relation.relnamespace = namespace.oid
            AND relation.relkind IN ('r', 'p')
            AND (
              has_table_privilege(reachable.role_id, relation.oid, 'INSERT')
              OR has_table_privilege(reachable.role_id, relation.oid, 'UPDATE')
              OR has_table_privilege(reachable.role_id, relation.oid, 'DELETE')
              OR has_table_privilege(reachable.role_id, relation.oid, 'TRUNCATE')
            )
        )
      )
    ORDER BY namespace.nspname
  `);
  if (privilegeResult.rows.length > 0) {
    throw new Error(
      `Database credential can write foreign network schemas: ${privilegeResult.rows.map(({ schema }) => schema).join(', ')}`,
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
