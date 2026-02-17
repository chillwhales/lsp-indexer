import { ENTITY_REGISTRY, getKnownDivergences } from './entityRegistry';
import { createGraphqlClient, GraphqlClient } from './graphqlClient';
import {
  ComparisonConfig,
  ComparisonReport,
  CountResult,
  FieldDiff,
  FKCoverageResult,
  RowDiff,
} from './types';

function normalizeValue(value: unknown): unknown {
  if (value === null || value === undefined || value === '') return null;
  return value;
}

/**
 * Deep-sort object keys before serializing, so JSON/JSONB fields
 * with identical content but different key order compare as equal.
 */
function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return '[' + value.map(stableStringify).join(',') + ']';
  }
  // After null/primitive/array checks, value is a plain object.
  // Use Object.entries to avoid needing a type assertion on the narrowed `object`.
  const entries = Object.entries(value);
  entries.sort(([a], [b]) => a.localeCompare(b));
  const sorted = entries.map(([key, val]) => `${JSON.stringify(key)}:${stableStringify(val)}`);
  return '{' + sorted.join(',') + '}';
}

function valuesEqual(a: unknown, b: unknown): boolean {
  return stableStringify(normalizeValue(a)) === stableStringify(normalizeValue(b));
}

function calcDiffPercent(a: number, b: number): number {
  if (a === 0 && b === 0) return 0;
  const max = Math.max(a, b);
  if (max === 0) return 100;
  return (Math.abs(a - b) / max) * 100;
}

/**
 * Build a content signature map for metadata sub-entities with random UUIDs.
 * Key = content signature (all fields except 'id'), Value = array of rows
 * This enables content-based matching when IDs are non-deterministic.
 * Uses an array value to handle duplicate-content rows without silent overwrites.
 */
function buildContentSignatureMap(
  rows: Record<string, unknown>[],
): Map<string, Record<string, unknown>[]> {
  const map = new Map<string, Record<string, unknown>[]>();

  for (const row of rows) {
    // Build signature from all fields except 'id'
    const contentFields = Object.entries(row)
      .filter(([key]) => key !== 'id')
      .sort(([a], [b]) => a.localeCompare(b));

    const signature = stableStringify(Object.fromEntries(contentFields));
    const existing = map.get(signature);
    if (existing) {
      existing.push(row);
    } else {
      map.set(signature, [row]);
    }
  }

  return map;
}

// ---------------------------------------------------------------------------
// FK Coverage validation
// ---------------------------------------------------------------------------

/**
 * FK coverage rules define which FK fields should be populated when the
 * target entity exists. Used to detect "orphaned nulls" — entities whose
 * FK is null but the corresponding target entity exists in the database.
 */
interface FKCoverageRule {
  /** Human-readable name for reporting */
  name: string;
  /** Hasura table name for the source entity */
  sourceTable: string;
  /** FK field name on the source entity (Hasura column, e.g., 'lsp3_profile_id') */
  fkField: string;
  /** Hasura table name for the target entity */
  targetTable: string;
  /** Given a source entity ID, derive the target entity ID */
  resolveTargetId: (sourceId: string) => string;
}

const FK_COVERAGE_RULES: readonly FKCoverageRule[] = [
  {
    name: 'UniversalProfile.lsp3Profile',
    sourceTable: 'universal_profile',
    fkField: 'lsp3_profile_id',
    targetTable: 'lsp3_profile',
    resolveTargetId: (id) => id,
  },
  {
    name: 'DigitalAsset.lsp4Metadata',
    sourceTable: 'digital_asset',
    fkField: 'lsp4_metadata_id',
    targetTable: 'lsp4_metadata',
    resolveTargetId: (id) => id,
  },
  {
    name: 'NFT.lsp4Metadata',
    sourceTable: 'nft',
    fkField: 'lsp4_metadata_id',
    targetTable: 'lsp4_metadata',
    resolveTargetId: (id) => id,
  },
  {
    name: 'NFT.lsp4MetadataBaseUri',
    sourceTable: 'nft',
    fkField: 'lsp4_metadata_base_uri_id',
    targetTable: 'lsp4_metadata',
    resolveTargetId: (id) => `BaseURI - ${id}`,
  },
];

/**
 * Check FK coverage for a single endpoint. For each rule, samples entities
 * with null FK fields and checks if the corresponding target entity exists.
 *
 * Returns results per rule with orphaned null counts.
 */
async function checkFKCoverage(
  client: GraphqlClient,
  endpointLabel: string,
  sampleSize: number,
): Promise<FKCoverageResult[]> {
  const results: FKCoverageResult[] = [];

  for (const rule of FK_COVERAGE_RULES) {
    // Find entities with null FK
    const nullFkIds = await client.queryIdsWhereFieldNull(
      rule.sourceTable,
      rule.fkField,
      sampleSize,
    );

    if (nullFkIds.length === 0) {
      results.push({
        rule: rule.name,
        endpoint: endpointLabel,
        nullFkCount: 0,
        orphanedNullCount: 0,
        orphanedSampleIds: [],
      });
      continue;
    }

    // Derive target IDs and check which ones exist
    const targetIds = nullFkIds.map(rule.resolveTargetId);
    const existingTargets = await client.queryRowsByIds(rule.targetTable, targetIds);
    const existingTargetIds = new Set(existingTargets.map((r) => String(r.id)));

    // Find orphaned nulls: source has null FK but target exists
    const orphanedIds = nullFkIds.filter((sourceId) =>
      existingTargetIds.has(rule.resolveTargetId(sourceId)),
    );

    results.push({
      rule: rule.name,
      endpoint: endpointLabel,
      nullFkCount: nullFkIds.length,
      orphanedNullCount: orphanedIds.length,
      orphanedSampleIds: orphanedIds.slice(0, 5), // Keep sample small for reporting
    });
  }

  return results;
}

/**
 * Run four-phase comparison between two Hasura endpoints.
 *
 * Phase 1: Aggregate row counts per entity type
 * Phase 2: Sampled content diffs with known divergence detection
 * Phase 3: FK coverage validation (orphaned null detection)
 * Phase 4: Summary with pass/fail verdict (respecting tolerance)
 */
export async function runComparison(config: ComparisonConfig): Promise<ComparisonReport> {
  const sourceLabel = config.mode === 'v1-v2' ? 'V1' : 'V2-A';
  const targetLabel = config.mode === 'v1-v2' ? 'V2' : 'V2-B';

  const sourceClient = createGraphqlClient(config.sourceUrl, config.sourceSecret);
  const targetClient = createGraphqlClient(config.targetUrl, config.targetSecret);

  // Health check
  process.stderr.write('Health-checking endpoints...\n');
  const [sourceHealthy, targetHealthy] = await Promise.all([
    sourceClient.checkHealth(),
    targetClient.checkHealth(),
  ]);

  if (!sourceHealthy) {
    throw new Error(`${sourceLabel} endpoint health check failed: ${config.sourceUrl}`);
  }
  if (!targetHealthy) {
    throw new Error(`${targetLabel} endpoint health check failed: ${config.targetUrl}`);
  }

  const entityFilter = config.entities;
  const entitiesToCompare = entityFilter
    ? ENTITY_REGISTRY.filter((e) => entityFilter.includes(e.name))
    : ENTITY_REGISTRY;

  const counts: CountResult[] = [];
  const missingEntityTypes: ComparisonReport['missingEntityTypes'] = [];

  // PHASE 1: Aggregate row counts
  process.stderr.write(
    `\nPhase 1: Counting rows across ${entitiesToCompare.length} entity types...\n`,
  );

  for (const entity of entitiesToCompare) {
    process.stderr.write(`\rComparing ${entity.name}...`.padEnd(60, ' '));

    const [sourceCount, targetCount] = await Promise.all([
      sourceClient.queryCount(entity.hasuraTable),
      targetClient.queryCount(entity.hasuraTable),
    ]);

    if (sourceCount === -1) {
      missingEntityTypes.push({ endpoint: 'source', entityName: entity.name });
    }
    if (targetCount === -1) {
      missingEntityTypes.push({ endpoint: 'target', entityName: entity.name });
    }

    const isMissing = sourceCount === -1 || targetCount === -1;
    const diffPercent = isMissing
      ? 100
      : calcDiffPercent(Math.max(sourceCount, 0), Math.max(targetCount, 0));

    counts.push({
      entityName: entity.name,
      sourceCount,
      targetCount,
      match: !isMissing && sourceCount === targetCount,
      withinTolerance: !isMissing && diffPercent <= config.tolerancePercent,
      diffPercent,
    });

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  process.stderr.write('\r'.padEnd(60, ' ') + '\r');

  // PHASE 2: Sampled content diffs
  process.stderr.write('\nPhase 2: Sampling content diffs...\n');

  const sampleDiffs: RowDiff[] = [];

  for (const entity of entitiesToCompare) {
    const countResult = counts.find((c) => c.entityName === entity.name);
    if (!countResult || countResult.sourceCount <= 0 || countResult.targetCount <= 0) {
      continue;
    }

    process.stderr.write(`\rSampling ${entity.name}...`.padEnd(60, ' '));

    let sourceRows: Record<string, unknown>[];
    let targetRows: Record<string, unknown>[];
    let sourceRowMap: Map<string, Record<string, unknown>>;
    let targetRowMap: Map<string, Record<string, unknown>>;

    // For metadata sub-entities with random UUIDs, use content-based matching
    if (entity.isMetadataSub) {
      // Fetch full sample rows (not just IDs) from both endpoints
      [sourceRows, targetRows] = await Promise.all([
        sourceClient.querySampleRows(entity.hasuraTable, config.sampleSize),
        targetClient.querySampleRows(entity.hasuraTable, config.sampleSize),
      ]);

      // Build content signature maps for matching
      const sourceSignatureMap = buildContentSignatureMap(sourceRows);
      const targetSignatureMap = buildContentSignatureMap(targetRows);

      // Warn if either side produced an empty map but counts indicate data exists
      if (sourceSignatureMap.size === 0 || targetSignatureMap.size === 0) {
        process.stderr.write(
          `\n[warning] Content-based sampling for metadata sub-entity "${entity.name}" ` +
            'returned no sample rows on one side. If data is expected here, this may indicate a query or ' +
            'connection issue and can cause all rows from the other side to appear as missing in the diff.\n',
        );
      }

      // Flatten to single-row maps for comparison (take first row per signature)
      sourceRowMap = new Map(
        Array.from(sourceSignatureMap.entries()).map(([sig, rows]) => [sig, rows[0]]),
      );
      targetRowMap = new Map(
        Array.from(targetSignatureMap.entries()).map(([sig, rows]) => [sig, rows[0]]),
      );
    } else {
      // For core entities with deterministic IDs, use ID-based matching (original behavior)
      const sampleIds = await sourceClient.querySampleIds(entity.hasuraTable, config.sampleSize);
      if (sampleIds.length === 0) continue;

      [sourceRows, targetRows] = await Promise.all([
        sourceClient.queryRowsByIds(entity.hasuraTable, sampleIds),
        targetClient.queryRowsByIds(entity.hasuraTable, sampleIds),
      ]);

      sourceRowMap = new Map(sourceRows.map((row) => [String(row.id), row]));
      targetRowMap = new Map(targetRows.map((row) => [String(row.id), row]));
    }

    const knownDivergencesForEntity = getKnownDivergences(entity.name, config.mode);
    const knownFieldSet = new Set(knownDivergencesForEntity.map((d) => d.field));

    if (entity.isMetadataSub) {
      // Content-based comparison for metadata sub-entities
      const sourceSignatures = new Set(sourceRowMap.keys());
      const targetSignatures = new Set(targetRowMap.keys());

      // Check for source rows missing in target
      for (const signature of sourceSignatures) {
        if (!targetSignatures.has(signature)) {
          const sourceRow = sourceRowMap.get(signature);
          if (!sourceRow) continue;
          const allFields: FieldDiff[] = Object.keys(sourceRow)
            .filter((field) => field !== 'id')
            .map((field) => ({ field, sourceValue: sourceRow[field], targetValue: undefined }));

          sampleDiffs.push({
            entityName: entity.name,
            rowId: String(sourceRow.id),
            diffs: allFields,
            knownDivergences: [],
            unexpectedDiffs: allFields,
          });
        }
      }

      // Check for target rows missing in source
      for (const signature of targetSignatures) {
        if (!sourceSignatures.has(signature)) {
          const targetRow = targetRowMap.get(signature);
          if (!targetRow) continue;
          const allFields: FieldDiff[] = Object.keys(targetRow)
            .filter((field) => field !== 'id')
            .map((field) => ({ field, sourceValue: undefined, targetValue: targetRow[field] }));

          sampleDiffs.push({
            entityName: entity.name,
            rowId: String(targetRow.id),
            diffs: allFields,
            knownDivergences: [],
            unexpectedDiffs: allFields,
          });
        }
      }

      // Note: Matching signatures are considered identical (no diffs to report)
    } else {
      // ID-based comparison for core entities (original behavior)
      const sampleKeys = Array.from(sourceRowMap.keys());

      for (const rowId of sampleKeys) {
        const sourceRow = sourceRowMap.get(rowId);
        const targetRow = targetRowMap.get(rowId);

        if (sourceRow && !targetRow) {
          const allFields: FieldDiff[] = Object.keys(sourceRow)
            .filter((field) => field !== 'id')
            .map((field) => ({ field, sourceValue: sourceRow[field], targetValue: undefined }));

          sampleDiffs.push({
            entityName: entity.name,
            rowId,
            diffs: allFields,
            knownDivergences: [],
            unexpectedDiffs: allFields,
          });
          continue;
        }

        if (!sourceRow || !targetRow) continue;

        const knownDivergences: FieldDiff[] = [];
        const unexpectedDiffs: FieldDiff[] = [];

        const allFields = new Set([
          ...Object.keys(sourceRow).filter((f) => f !== 'id'),
          ...Object.keys(targetRow).filter((f) => f !== 'id'),
        ]);

        for (const field of allFields) {
          const sourceValue = sourceRow[field];
          const targetValue = targetRow[field];

          if (!valuesEqual(sourceValue, targetValue)) {
            const fieldDiff: FieldDiff = { field, sourceValue, targetValue };

            if (knownFieldSet.has(field)) {
              knownDivergences.push(fieldDiff);
            } else {
              unexpectedDiffs.push(fieldDiff);
            }
          }
        }

        if (knownDivergences.length > 0 || unexpectedDiffs.length > 0) {
          sampleDiffs.push({
            entityName: entity.name,
            rowId,
            diffs: [...knownDivergences, ...unexpectedDiffs],
            knownDivergences,
            unexpectedDiffs,
          });
        }
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  process.stderr.write('\r'.padEnd(60, ' ') + '\r');

  // PHASE 3: FK Coverage validation
  // Check that FK fields are populated when the target entity exists.
  // In v1-v2 mode, only check the target (V2) endpoint since V1 never populated these.
  // In v2-v2 mode, check both endpoints.
  process.stderr.write('\nPhase 3: Checking FK coverage...\n');

  const fkCoverage: FKCoverageResult[] = [];

  if (config.mode === 'v2-v2') {
    const [sourceFkResults, targetFkResults] = await Promise.all([
      checkFKCoverage(sourceClient, sourceLabel, config.sampleSize),
      checkFKCoverage(targetClient, targetLabel, config.sampleSize),
    ]);
    fkCoverage.push(...sourceFkResults, ...targetFkResults);
  } else {
    // v1-v2: only check V2 (target) endpoint
    const targetFkResults = await checkFKCoverage(targetClient, targetLabel, config.sampleSize);
    fkCoverage.push(...targetFkResults);
  }

  const fkCoverageOrphans = fkCoverage.reduce((sum, r) => sum + r.orphanedNullCount, 0);

  for (const result of fkCoverage) {
    if (result.orphanedNullCount > 0) {
      process.stderr.write(
        `  [FK] ${result.endpoint} ${result.rule}: ${result.orphanedNullCount}/${result.nullFkCount} orphaned nulls\n`,
      );
    }
  }

  // PHASE 4: Summary
  process.stderr.write('\nPhase 4: Generating summary...\n');

  const countFailures = counts.filter((c) => {
    if (c.match || c.withinTolerance) return false;
    const e = entitiesToCompare.find((ent) => ent.name === c.entityName);
    return !e?.isMetadataSub;
  });

  const totalUnexpectedDiffs = sampleDiffs.reduce(
    (sum, diff) => sum + diff.unexpectedDiffs.length,
    0,
  );

  const targetMissingTypes = missingEntityTypes.filter((m) => m.endpoint === 'target');
  const sourceMissingTypes = missingEntityTypes.filter((m) => m.endpoint === 'source');

  // In v2-v2 mode, any missing entity (source or target) is a failure.
  // In v1-v2 mode, only target-missing matters (source may have legacy tables).
  const missingTypeFailure =
    config.mode === 'v2-v2'
      ? targetMissingTypes.length > 0 || sourceMissingTypes.length > 0
      : targetMissingTypes.length > 0;

  const passed =
    countFailures.length === 0 &&
    totalUnexpectedDiffs === 0 &&
    !missingTypeFailure &&
    fkCoverageOrphans === 0;

  return {
    mode: config.mode,
    sourceLabel,
    targetLabel,
    tolerancePercent: config.tolerancePercent,
    counts,
    sampleDiffs,
    fkCoverage,
    missingEntityTypes,
    passed,
  };
}
