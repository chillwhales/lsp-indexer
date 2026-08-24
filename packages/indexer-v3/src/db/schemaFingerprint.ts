import { getTableName, sql, type SQL } from 'drizzle-orm';
import { SHARED_SCHEMA, assertPostgresIdentifier } from './names.js';
import { rollbackTables } from './schema.js';

export const EXPECTED_CHAIN_SCHEMA_FINGERPRINT = 'dff1d9134b169046499a087c7a9e59ec';

/** Deterministic live-catalog fingerprint returned for one chain schema. */
export interface ChainSchemaFingerprintRow extends Record<string, unknown> {
  fingerprint: string;
}

/**
 * Fingerprint every non-snapshot table, sequence, column, constraint, and index in a chain schema.
 *
 * @param networkSchema Canonical chain schema to inspect.
 * @returns A schema-neutral PostgreSQL catalog fingerprint query.
 * @throws When the schema name is not a canonical PostgreSQL identifier.
 */
export function createChainSchemaFingerprintQuery(networkSchema: string): SQL {
  const validatedSchema = assertPostgresIdentifier(networkSchema, 'network database schema');
  const snapshotTableNames = rollbackTables.map((table) => `${getTableName(table)}__snapshots`);

  return sql`
    WITH catalog_settings AS MATERIALIZED (
      SELECT set_config(
               'search_path',
               format(
                 '%I,%I,%I',
                 ${validatedSchema}::text,
                 ${SHARED_SCHEMA}::text,
                 'public'
               ),
               true
             ) AS search_path
    ), chain_namespace AS (
      SELECT oid
      FROM pg_namespace
      CROSS JOIN catalog_settings
      WHERE nspname = ${validatedSchema}
    ), relations AS (
      SELECT relation.*
      FROM pg_class relation
      WHERE relation.relnamespace = (SELECT oid FROM chain_namespace)
        AND relation.relkind IN ('r', 'p', 'S')
        AND NOT (
          relation.relkind IN ('r', 'p')
          AND relation.relname IN (
            ${sql.join(
              snapshotTableNames.map((name) => sql`${name}`),
              sql`, `,
            )}
          )
        )
    ), descriptors AS (
      SELECT format(
               'relation|%s|%s|%s|%s|%s|%s|%s',
               relation.relname,
               relation.relkind,
               relation.relpersistence,
               relation.relrowsecurity,
               relation.relforcerowsecurity,
               relation.relreplident,
               COALESCE((
                 SELECT string_agg(relation_option.option, ',' ORDER BY relation_option.option)
                 FROM unnest(COALESCE(relation.reloptions, ARRAY[]::text[]))
                   AS relation_option(option)
               ), '')
             ) AS descriptor
      FROM relations relation
      UNION ALL
      SELECT format(
               'column|%s|%s|%s|%s|%s|%s|%s|%s|%s',
               relation.relname,
               attribute.attnum,
               attribute.attname,
               format_type(attribute.atttypid, attribute.atttypmod),
               attribute.attnotnull,
               attribute.attidentity,
               attribute.attgenerated,
               COALESCE(column_collation.collname, ''),
               replace(
                 COALESCE(pg_get_expr(attribute_default.adbin, attribute_default.adrelid, true), ''),
                 ${validatedSchema},
                 '<chain>'
               )
             ) AS descriptor
      FROM relations relation
      JOIN pg_attribute attribute ON attribute.attrelid = relation.oid
      LEFT JOIN pg_attrdef attribute_default
        ON attribute_default.adrelid = relation.oid
       AND attribute_default.adnum = attribute.attnum
      LEFT JOIN pg_collation column_collation
        ON column_collation.oid = attribute.attcollation
      WHERE relation.relkind IN ('r', 'p')
        AND attribute.attnum > 0
        AND NOT attribute.attisdropped
      UNION ALL
      SELECT format(
               'constraint|%s|%s|%s|%s|%s|%s|%s',
               relation.relname,
               constraint_record.conname,
               constraint_record.contype,
               constraint_record.condeferrable,
               constraint_record.condeferred,
               constraint_record.convalidated,
               replace(
                 pg_get_constraintdef(constraint_record.oid, true),
                 ${validatedSchema},
                 '<chain>'
               )
             ) AS descriptor
      FROM relations relation
      JOIN pg_constraint constraint_record ON constraint_record.conrelid = relation.oid
      WHERE relation.relkind IN ('r', 'p')
      UNION ALL
      SELECT format(
               'index|%s|%s|%s|%s|%s|%s|%s|%s|%s',
               relation.relname,
               index_relation.relname,
               index_record.indisprimary,
               index_record.indisunique,
               index_record.indisexclusion,
               index_record.indisclustered,
               index_record.indisvalid,
               index_record.indisready,
               replace(
                 pg_get_indexdef(index_record.indexrelid, 0, true),
                 ${validatedSchema},
                 '<chain>'
               )
             ) AS descriptor
      FROM relations relation
      JOIN pg_index index_record ON index_record.indrelid = relation.oid
      JOIN pg_class index_relation ON index_relation.oid = index_record.indexrelid
      WHERE relation.relkind IN ('r', 'p')
      UNION ALL
      SELECT format(
               'sequence|%s|%s|%s|%s|%s|%s|%s',
               relation.relname,
               sequence_record.seqstart,
               sequence_record.seqincrement,
               sequence_record.seqmax,
               sequence_record.seqmin,
               sequence_record.seqcache,
               sequence_record.seqcycle
             ) AS descriptor
      FROM relations relation
      JOIN pg_sequence sequence_record ON sequence_record.seqrelid = relation.oid
      WHERE relation.relkind = 'S'
    )
    SELECT md5(COALESCE(string_agg(descriptor, E'\n' ORDER BY descriptor), '')) AS fingerprint
    FROM descriptors
  `;
}

/** Reject a live chain schema that differs from the reviewed v3 catalog. */
export function assertChainSchemaFingerprint(
  networkSchema: string,
  actualFingerprint: string | undefined,
): void {
  if (actualFingerprint !== EXPECTED_CHAIN_SCHEMA_FINGERPRINT) {
    throw new Error(
      `Database schema "${networkSchema}" fingerprint is "${actualFingerprint ?? 'missing'}"; expected "${EXPECTED_CHAIN_SCHEMA_FINGERPRINT}"`,
    );
  }
}
