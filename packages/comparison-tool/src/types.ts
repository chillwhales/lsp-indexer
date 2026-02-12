/**
 * Comparison mode determines which set of known divergences apply.
 *
 * - v1-v2: Cross-version comparison (V1 indexer vs V2 indexer).
 *   Known divergences include schema changes between versions.
 * - v2-v2: Redundancy comparison (two V2 instances).
 *   No known divergences expected — any diff is a bug.
 */
export type ComparisonMode = 'v1-v2' | 'v2-v2';

export interface EntityDefinition {
  name: string;
  hasuraTable: string;
  primaryKey: string;
  category: 'core' | 'event' | 'metadata' | 'ownership' | 'lsp' | 'custom';
  isMetadataSub: boolean;
}

export interface KnownDivergence {
  entityType: string;
  field: string;
  reason: string;
}

export interface ComparisonConfig {
  sourceUrl: string;
  targetUrl: string;
  sourceSecret?: string;
  targetSecret?: string;
  mode: ComparisonMode;
  entities?: string[];
  sampleSize: number;
  tolerancePercent: number;
}

export interface CountResult {
  entityName: string;
  sourceCount: number;
  targetCount: number;
  match: boolean;
  withinTolerance: boolean;
  diffPercent: number;
}

export interface FieldDiff {
  field: string;
  sourceValue: unknown;
  targetValue: unknown;
}

export interface RowDiff {
  entityName: string;
  rowId: string;
  diffs: FieldDiff[];
  knownDivergences: FieldDiff[];
  unexpectedDiffs: FieldDiff[];
}

export interface ComparisonReport {
  mode: ComparisonMode;
  sourceLabel: string;
  targetLabel: string;
  tolerancePercent: number;
  counts: CountResult[];
  sampleDiffs: RowDiff[];
  missingEntityTypes: { endpoint: 'source' | 'target'; entityName: string }[];
  passed: boolean;
}
