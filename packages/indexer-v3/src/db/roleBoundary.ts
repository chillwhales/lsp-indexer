import { getTableName, sql, type SQL } from 'drizzle-orm';
import {
  MIGRATIONS_TABLE,
  SHARED_ENUMS,
  SHARED_SCHEMA,
  assertPostgresIdentifier,
} from './names.js';
import { networkConfig, rollbackTables, sqdCursor } from './schema.js';

const EXPECTED_CHAIN_TABLE_NAMES = [
  MIGRATIONS_TABLE,
  getTableName(networkConfig),
  getTableName(sqdCursor),
  ...rollbackTables.map(getTableName),
].sort();

/**
 * Build the catalog audit that requires the writer to own every migrated chain table.
 *
 * @param role Deterministic non-login writer role to inspect.
 * @param networkSchema Schema containing the expected v3 tables.
 * @returns A query whose rows describe missing tables or tables owned by another role.
 * @throws When either identifier is not a canonical PostgreSQL identifier.
 */
export function createChainTableOwnershipQuery(role: string, networkSchema: string): SQL {
  const validatedRole = assertPostgresIdentifier(role, 'database writer role');
  const validatedSchema = assertPostgresIdentifier(networkSchema, 'network database schema');

  return sql`
    WITH writer_role AS (
      SELECT oid
      FROM pg_roles
      WHERE rolname = ${validatedRole}
    ), expected_table(table_name) AS (
      VALUES ${sql.join(
        EXPECTED_CHAIN_TABLE_NAMES.map((tableName) => sql`(${tableName})`),
        sql`, `,
      )}
    )
    SELECT expected_table.table_name AS "tableName",
           COALESCE(pg_get_userbyid(relation.relowner), 'missing') AS owner
    FROM expected_table
    CROSS JOIN writer_role
    LEFT JOIN pg_namespace namespace
      ON namespace.nspname = ${validatedSchema}
    LEFT JOIN pg_class relation
      ON relation.relnamespace = namespace.oid
     AND relation.relname = expected_table.table_name
     AND relation.relkind IN ('r', 'p')
    WHERE relation.oid IS NULL OR relation.relowner <> writer_role.oid
    ORDER BY expected_table.table_name
  `;
}

/**
 * Build the catalog audit that confines a writer role to one network schema.
 *
 * @param role Deterministic non-login writer role to inspect.
 * @param networkSchema The only schema where the writer may own objects or hold arbitrary ACLs.
 * @returns A query whose rows describe dependencies outside the approved boundary.
 * @throws When either identifier is not a canonical PostgreSQL identifier.
 */
export function createWriterRoleBoundaryQuery(role: string, networkSchema: string): SQL {
  const validatedRole = assertPostgresIdentifier(role, 'database writer role');
  const validatedSchema = assertPostgresIdentifier(networkSchema, 'network database schema');
  const sharedEnumNames = Object.keys(SHARED_ENUMS);

  return sql`
    WITH writer_role AS (
      SELECT oid
      FROM pg_roles
      WHERE rolname = ${validatedRole}
    ), expected_schema AS (
      SELECT oid
      FROM pg_namespace
      WHERE nspname = ${validatedSchema}
    ), shared_schema AS (
      SELECT oid, nspacl
      FROM pg_namespace
      WHERE nspname = ${SHARED_SCHEMA}
    ), shared_types AS (
      SELECT shared_type.oid, shared_type.typacl
      FROM pg_type shared_type
      JOIN pg_namespace namespace ON namespace.oid = shared_type.typnamespace
      WHERE namespace.nspname = ${SHARED_SCHEMA}
        AND shared_type.typname IN (
          ${sql.join(
            sharedEnumNames.map((name) => sql`${name}`),
            sql`, `,
          )}
        )
    ), current_database_object AS (
      SELECT oid
      FROM pg_database
      WHERE datname = current_database()
    ), dependencies AS (
      SELECT dependency.classid,
             dependency.objid,
             dependency.objsubid,
             dependency.deptype,
             identified.schema AS object_schema,
             CASE dependency.deptype
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
      CROSS JOIN writer_role
      CROSS JOIN current_database_object
      CROSS JOIN LATERAL pg_identify_object(
        dependency.classid,
        dependency.objid,
        dependency.objsubid
      ) identified
      WHERE dependency.refclassid = 'pg_authid'::regclass
        AND dependency.refobjid = writer_role.oid
        AND dependency.dbid IN (0, current_database_object.oid)
        AND dependency.deptype IN ('a', 'i', 'o', 'r')
    )
    SELECT dependency.kind, dependency.object
    FROM dependencies dependency
    CROSS JOIN writer_role
    CROSS JOIN expected_schema
    CROSS JOIN shared_schema
    WHERE NOT (
      COALESCE(dependency.object_schema = ${validatedSchema}, false)
      OR (
        dependency.classid = 'pg_namespace'::regclass
        AND dependency.objid = expected_schema.oid
      )
      OR (
        dependency.classid = 'pg_policy'::regclass
        AND EXISTS (
          SELECT 1
          FROM pg_policy policy
          JOIN pg_class relation ON relation.oid = policy.polrelid
          WHERE policy.oid = dependency.objid
            AND relation.relnamespace = expected_schema.oid
        )
      )
      OR (
        dependency.classid = 'pg_default_acl'::regclass
        AND EXISTS (
          SELECT 1
          FROM pg_default_acl default_acl
          WHERE default_acl.oid = dependency.objid
            AND default_acl.defaclnamespace = expected_schema.oid
        )
      )
      OR (
        dependency.deptype = 'a'
        AND dependency.classid = 'pg_namespace'::regclass
        AND dependency.objid = shared_schema.oid
        AND EXISTS (
          SELECT 1
          FROM aclexplode(shared_schema.nspacl) acl
          WHERE acl.grantee = writer_role.oid
            AND acl.privilege_type = 'USAGE'
            AND NOT acl.is_grantable
        )
        AND NOT EXISTS (
          SELECT 1
          FROM aclexplode(shared_schema.nspacl) acl
          WHERE acl.grantee = writer_role.oid
            AND (acl.privilege_type <> 'USAGE' OR acl.is_grantable)
        )
      )
      OR (
        dependency.deptype = 'a'
        AND dependency.classid = 'pg_type'::regclass
        AND EXISTS (
          SELECT 1
          FROM shared_types shared_type
          WHERE shared_type.oid = dependency.objid
            AND EXISTS (
              SELECT 1
              FROM aclexplode(shared_type.typacl) acl
              WHERE acl.grantee = writer_role.oid
                AND acl.privilege_type = 'USAGE'
                AND NOT acl.is_grantable
            )
            AND NOT EXISTS (
              SELECT 1
              FROM aclexplode(shared_type.typacl) acl
              WHERE acl.grantee = writer_role.oid
                AND (acl.privilege_type <> 'USAGE' OR acl.is_grantable)
            )
        )
      )
    )
    ORDER BY dependency.kind, dependency.object
  `;
}
