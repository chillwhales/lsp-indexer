import { ENTITY_REGISTRY, getKnownDivergences } from './entityRegistry';
import { createGraphqlClient } from './graphqlClient';
import { ComparisonConfig, ComparisonReport, CountResult, FieldDiff, RowDiff } from './types';

/**
 * Helper to normalize null/undefined/empty values for comparison.
 * Hasura may serialize these differently between V1 and V2.
 */
function normalizeValue(value: unknown): unknown {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return value;
}

/**
 * Helper to check if two values are equivalent after normalization.
 */
function valuesEqual(v1: unknown, v2: unknown): boolean {
  const norm1 = normalizeValue(v1);
  const norm2 = normalizeValue(v2);

  // Deep comparison using JSON.stringify for objects/arrays
  return JSON.stringify(norm1) === JSON.stringify(norm2);
}

/**
 * Run three-phase comparison between V1 and V2 Hasura endpoints.
 *
 * Phase 1: Aggregate row counts per entity type
 * Phase 2: Sampled content diffs with known divergence detection
 * Phase 3: Summary with pass/fail verdict
 */
export async function runComparison(config: ComparisonConfig): Promise<ComparisonReport> {
  // Create GraphQL clients for V1 and V2
  const v1Client = createGraphqlClient(config.v1Url, config.v1Secret);
  const v2Client = createGraphqlClient(config.v2Url, config.v2Secret);

  // Health check both endpoints
  process.stderr.write('Health-checking endpoints...\n');
  const v1Healthy = await v1Client.checkHealth();
  const v2Healthy = await v2Client.checkHealth();

  if (!v1Healthy) {
    throw new Error(`V1 endpoint health check failed: ${config.v1Url}`);
  }
  if (!v2Healthy) {
    throw new Error(`V2 endpoint health check failed: ${config.v2Url}`);
  }

  // Determine entity list (filtered or all)
  const entitiesToCompare = config.entities
    ? ENTITY_REGISTRY.filter((e) => config.entities!.includes(e.name))
    : ENTITY_REGISTRY;

  const counts: CountResult[] = [];
  const missingEntityTypes: { endpoint: 'v1' | 'v2'; entityName: string }[] = [];

  // PHASE 1: Aggregate row counts
  process.stderr.write(
    `\nPhase 1: Counting rows across ${entitiesToCompare.length} entity types...\n`,
  );

  for (const entity of entitiesToCompare) {
    process.stderr.write(`\rComparing ${entity.name}...`.padEnd(60, ' '));

    // Query counts from both endpoints in parallel
    const [v1Count, v2Count] = await Promise.all([
      v1Client.queryCount(entity.hasuraTable),
      v2Client.queryCount(entity.hasuraTable),
    ]);

    // Track missing entity types
    if (v1Count === -1) {
      missingEntityTypes.push({ endpoint: 'v1', entityName: entity.name });
    }
    if (v2Count === -1) {
      missingEntityTypes.push({ endpoint: 'v2', entityName: entity.name });
    }

    counts.push({
      entityName: entity.name,
      v1Count,
      v2Count,
      match: v1Count === v2Count,
    });

    // Small delay to avoid overwhelming Hasura
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  process.stderr.write('\r'.padEnd(60, ' ') + '\r');

  // PHASE 2: Sampled content diffs
  process.stderr.write('\nPhase 2: Sampling content diffs...\n');

  const sampleDiffs: RowDiff[] = [];

  for (const entity of entitiesToCompare) {
    // Find count result for this entity
    const countResult = counts.find((c) => c.entityName === entity.name);
    if (!countResult) continue;

    // Skip if either endpoint has no rows
    if (countResult.v1Count <= 0 || countResult.v2Count <= 0) {
      continue;
    }

    process.stderr.write(`\rSampling ${entity.name}...`.padEnd(60, ' '));

    // Fetch sample IDs from V1
    const sampleIds = await v1Client.querySampleIds(entity.hasuraTable, config.sampleSize);
    if (sampleIds.length === 0) {
      continue;
    }

    // Fetch rows from both endpoints for these IDs
    const [v1Rows, v2Rows] = await Promise.all([
      v1Client.queryRowsByIds(entity.hasuraTable, sampleIds),
      v2Client.queryRowsByIds(entity.hasuraTable, sampleIds),
    ]);

    // Create maps for easy lookup
    const v1RowMap = new Map(v1Rows.map((row) => [row.id as string, row]));
    const v2RowMap = new Map(v2Rows.map((row) => [row.id as string, row]));

    // Get known divergences for this entity type
    const knownDivergencesForEntity = getKnownDivergences(entity.name);
    const knownFieldSet = new Set(knownDivergencesForEntity.map((d) => d.field));

    // Compare each sampled row
    for (const rowId of sampleIds) {
      const v1Row = v1RowMap.get(rowId);
      const v2Row = v2RowMap.get(rowId);

      // If V2 is missing a row that V1 has, record as unexpected diff
      if (v1Row && !v2Row) {
        const allFields: FieldDiff[] = Object.keys(v1Row)
          .filter((field) => field !== 'id')
          .map((field) => ({
            field,
            v1Value: v1Row[field],
            v2Value: undefined,
          }));

        sampleDiffs.push({
          entityName: entity.name,
          rowId,
          diffs: allFields,
          knownDivergences: [],
          unexpectedDiffs: allFields,
        });
        continue;
      }

      // Skip if V1 is missing the row (unlikely with our sampling strategy)
      if (!v1Row || !v2Row) {
        continue;
      }

      // Compare all fields
      const knownDivergences: FieldDiff[] = [];
      const unexpectedDiffs: FieldDiff[] = [];

      // Get all field names (union of V1 and V2 fields)
      const allFields = new Set([
        ...Object.keys(v1Row).filter((f) => f !== 'id'),
        ...Object.keys(v2Row).filter((f) => f !== 'id'),
      ]);

      for (const field of allFields) {
        const v1Value = v1Row[field];
        const v2Value = v2Row[field];

        if (!valuesEqual(v1Value, v2Value)) {
          const fieldDiff: FieldDiff = { field, v1Value, v2Value };

          // Check if this is a known divergence
          if (knownFieldSet.has(field)) {
            knownDivergences.push(fieldDiff);
          } else {
            unexpectedDiffs.push(fieldDiff);
          }
        }
      }

      // Only record rows that have at least one diff
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

    // Small delay
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  process.stderr.write('\r'.padEnd(60, ' ') + '\r');

  // PHASE 3: Summary
  process.stderr.write('\nPhase 3: Generating summary...\n');

  // Count mismatches, excluding metadata sub-entities
  const countMismatches = counts.filter((c) => {
    if (c.match) return false;
    const entity = entitiesToCompare.find((e) => e.name === c.entityName);
    return !entity?.isMetadataSub; // Exclude metadata timing differences
  });

  // Count unexpected diffs
  const totalUnexpectedDiffs = sampleDiffs.reduce(
    (sum, diff) => sum + diff.unexpectedDiffs.length,
    0,
  );

  // V2 missing entity types are failures (V1 missing is just a warning)
  const v2MissingTypes = missingEntityTypes.filter((m) => m.endpoint === 'v2');

  // Pass only if all counts match and no unexpected diffs
  const passed =
    countMismatches.length === 0 && totalUnexpectedDiffs === 0 && v2MissingTypes.length === 0;

  return {
    counts,
    sampleDiffs,
    missingEntityTypes,
    passed,
  };
}
