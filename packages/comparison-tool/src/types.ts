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

/**
 * Result of FK coverage validation for a single rule.
 *
 * Checks whether entities with null FK fields actually have a corresponding
 * target entity in the database. If the target exists but the FK is null,
 * that's an orphaned null — the FK should have been populated.
 */
export interface FKCoverageResult {
  /** Human-readable rule name (e.g., 'UniversalProfile.lsp3Profile') */
  rule: string;
  /** Endpoint label (e.g., 'V2' or 'V2-A') */
  endpoint: string;
  /** Number of entities sampled with null FK */
  nullFkCount: number;
  /** Number of those that have a corresponding target entity (orphaned nulls) */
  orphanedNullCount: number;
  /** Sample IDs of orphaned entities (for debugging) */
  orphanedSampleIds: string[];
}

export interface ComparisonReport {
  mode: ComparisonMode;
  sourceLabel: string;
  targetLabel: string;
  tolerancePercent: number;
  counts: CountResult[];
  sampleDiffs: RowDiff[];
  fkCoverage: FKCoverageResult[];
  missingEntityTypes: { endpoint: 'source' | 'target'; entityName: string }[];
  passed: boolean;
}
