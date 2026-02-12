import { ENTITY_REGISTRY, getKnownDivergences } from './entityRegistry';
import { createGraphqlClient } from './graphqlClient';
import { ComparisonConfig, ComparisonReport, CountResult, FieldDiff, RowDiff } from './types';

function normalizeValue(value: unknown): unknown {
  if (value === null || value === undefined || value === '') return null;
  return value;
}

function valuesEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(normalizeValue(a)) === JSON.stringify(normalizeValue(b));
}

function calcDiffPercent(a: number, b: number): number {
  if (a === 0 && b === 0) return 0;
  const max = Math.max(a, b);
  if (max === 0) return 100;
  return (Math.abs(a - b) / max) * 100;
}

/**
 * Run three-phase comparison between two Hasura endpoints.
 *
 * Phase 1: Aggregate row counts per entity type
 * Phase 2: Sampled content diffs with known divergence detection
 * Phase 3: Summary with pass/fail verdict (respecting tolerance)
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

  const entitiesToCompare = config.entities
    ? ENTITY_REGISTRY.filter((e) => config.entities!.includes(e.name))
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

    const diffPercent = calcDiffPercent(Math.max(sourceCount, 0), Math.max(targetCount, 0));

    counts.push({
      entityName: entity.name,
      sourceCount,
      targetCount,
      match: sourceCount === targetCount,
      withinTolerance: diffPercent <= config.tolerancePercent,
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

    const sampleIds = await sourceClient.querySampleIds(entity.hasuraTable, config.sampleSize);
    if (sampleIds.length === 0) continue;

    const [sourceRows, targetRows] = await Promise.all([
      sourceClient.queryRowsByIds(entity.hasuraTable, sampleIds),
      targetClient.queryRowsByIds(entity.hasuraTable, sampleIds),
    ]);

    const sourceRowMap = new Map(sourceRows.map((row) => [row.id as string, row]));
    const targetRowMap = new Map(targetRows.map((row) => [row.id as string, row]));

    const knownDivergencesForEntity = getKnownDivergences(entity.name, config.mode);
    const knownFieldSet = new Set(knownDivergencesForEntity.map((d) => d.field));

    for (const rowId of sampleIds) {
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

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  process.stderr.write('\r'.padEnd(60, ' ') + '\r');

  // PHASE 3: Summary
  process.stderr.write('\nPhase 3: Generating summary...\n');

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

  const passed =
    countFailures.length === 0 && totalUnexpectedDiffs === 0 && targetMissingTypes.length === 0;

  return {
    mode: config.mode,
    sourceLabel,
    targetLabel,
    tolerancePercent: config.tolerancePercent,
    counts,
    sampleDiffs,
    missingEntityTypes,
    passed,
  };
}
