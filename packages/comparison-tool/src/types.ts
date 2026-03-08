/**
 * ID strategy determines how the comparison tool matches rows across endpoints.
 *
 * - address: ID is a deterministic address (e.g., '0x...'). Matched by ID.
 * - composite: ID is a deterministic composite key (e.g., 'addr - tokenId'). Matched by ID.
 * - uuid: ID is a random UUID. Cannot match by ID — must match by natural key fields.
 */
export type IdStrategy = 'address' | 'composite' | 'uuid';

export interface EntityDefinition {
  name: string;
  hasuraTable: string;
  primaryKey: string;
  category: 'core' | 'event' | 'metadata' | 'ownership' | 'lsp' | 'custom';
  isMetadataSub: boolean;
  idStrategy: IdStrategy;
  /** Hasura column names that form a natural key for matching UUID entities across endpoints */
  naturalKey?: string[];
  /** Parent FK column name for metadata sub-entities (deterministic, used for ordered sampling) */
  parentFk?: string;
}

export interface ComparisonConfig {
  sourceUrl: string;
  targetUrl: string;
  sourceSecret?: string;
  targetSecret?: string;
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
  /** Endpoint label (e.g., 'Source' or 'Target') */
  endpoint: string;
  /** Number of entities sampled with null FK */
  nullFkCount: number;
  /** Number of those that have a corresponding target entity (orphaned nulls) */
  orphanedNullCount: number;
  /** Sample IDs of orphaned entities (for debugging) */
  orphanedSampleIds: string[];
}

export interface ComparisonReport {
  sourceLabel: string;
  targetLabel: string;
  tolerancePercent: number;
  counts: CountResult[];
  sampleDiffs: RowDiff[];
  fkCoverage: FKCoverageResult[];
  missingEntityTypes: { endpoint: 'source' | 'target'; entityName: string }[];
  passed: boolean;
}
