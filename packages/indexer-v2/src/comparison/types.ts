// Entity comparison types

export interface EntityDefinition {
  name: string; // e.g., 'UniversalProfile'
  hasuraTable: string; // e.g., 'universal_profile' (snake_case)
  primaryKey: string; // usually 'id'
  category: 'core' | 'event' | 'metadata' | 'ownership' | 'lsp' | 'custom';
  isMetadataSub: boolean; // true for ProfileImage, AssetImage, Tags, etc.
}

export interface KnownDivergence {
  entityType: string;
  field: string;
  reason: string;
}

export interface ComparisonConfig {
  v1Url: string;
  v2Url: string;
  v1Secret?: string;
  v2Secret?: string;
  entities?: string[]; // filter to specific entity types
  sampleSize: number; // rows to sample per entity (default 100)
}

export interface CountResult {
  entityName: string;
  v1Count: number;
  v2Count: number;
  match: boolean;
}

export interface FieldDiff {
  field: string;
  v1Value: unknown;
  v2Value: unknown;
}

export interface RowDiff {
  entityName: string;
  rowId: string;
  diffs: FieldDiff[];
  knownDivergences: FieldDiff[]; // diffs that match known exclusions
  unexpectedDiffs: FieldDiff[]; // diffs that are bugs
}

export interface ComparisonReport {
  counts: CountResult[];
  sampleDiffs: RowDiff[];
  missingEntityTypes: { endpoint: 'v1' | 'v2'; entityName: string }[];
  passed: boolean;
}
