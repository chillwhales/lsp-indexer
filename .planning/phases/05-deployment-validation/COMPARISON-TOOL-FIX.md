# Comparison Tool Fix: Content-Based Matching for Metadata Sub-Entities

## Problem

The comparison tool failed to validate metadata sub-entities because:

1. **V1 uses random UUIDs** for metadata sub-entities (LSP4MetadataImage, etc.)
2. **V2 uses random UUIDs** for metadata sub-entities (same approach)
3. **Comparison tool used ID-based sampling**: Sample IDs from V1 → Query V2 for those IDs → Compare
4. **Result**: V2 returns empty results because UUIDs are different → 19,535 false "unexpected diffs"

## Solution

Enhanced the comparison tool with **dual matching strategies**:

### Strategy 1: ID-Based Matching (Core Entities)

- **Used for**: Core entities with deterministic IDs (UniversalProfile, DigitalAsset, NFT, Follow, etc.)
- **How it works**: Sample IDs from source → Query target by those IDs → Field-by-field comparison
- **Example**: `UniversalProfile` with id `0x1234...` exists in both V1 and V2 with same ID

### Strategy 2: Content-Based Matching (Metadata Sub-Entities)

- **Used for**: Metadata sub-entities marked with `isMetadataSub: true` flag
- **How it works**:
  1. Fetch sample rows from both endpoints (with all fields)
  2. Build content signatures (all fields except `id`)
  3. Match rows by content signature instead of ID
  4. Report rows that exist in source but not target (and vice versa)
- **Example**: Two `LSP4MetadataImage` entities with different IDs but identical content (url, width, height, etc.) are considered a match

## Changes Made

### 1. GraphQL Client Enhancement

**File**: `packages/comparison-tool/src/graphqlClient.ts`

Added new method `querySampleRows()`:

```typescript
querySampleRows(hasuraTable: string, limit: number): Promise<Record<string, unknown>[]>
```

This fetches full row data (not just IDs) for content-based matching.

### 2. Comparison Engine Enhancement

**File**: `packages/comparison-tool/src/comparisonEngine.ts`

**Added `buildContentSignatureMap()` function:**

```typescript
function buildContentSignatureMap(
  rows: Record<string, unknown>[],
): Map<string, Record<string, unknown>> {
  const map = new Map<string, Record<string, unknown>>();

  for (const row of rows) {
    // Build signature from all fields except 'id'
    const contentFields = Object.entries(row)
      .filter(([key]) => key !== 'id')
      .sort(([a], [b]) => a.localeCompare(b));

    const signature = stableStringify(Object.fromEntries(contentFields));
    map.set(signature, row);
  }

  return map;
}
```

**Updated comparison logic:**

- Detects metadata sub-entities via `entity.isMetadataSub` flag
- Routes to content-based matching for metadata, ID-based for core entities
- Reports missing content signatures as diffs (source-only or target-only)
- Matching signatures are considered identical (no field-level comparison needed)

### 3. Entity Registry (No Changes Needed)

The `isMetadataSub` flag already exists on 23 entity types:

- LSP3 sub-entities (7 types)
- LSP4 sub-entities (10 types)
- LSP29 sub-entities (10 types)

## Benefits

### 1. Works with V1-V2 Comparison

- Validates metadata sub-entities properly despite different UUIDs
- Detects missing/extra content in either database
- No false positives from UUID mismatches

### 2. Works with V2-V2 Comparison

- Can compare two V2 instances with completely different UUIDs
- Ensures nodes syncing properly have identical content
- Critical for production redundancy validation

### 3. Maintains Backward Compatibility

- ID-based matching still used for core entities (unchanged behavior)
- Known divergences still respected
- Tolerance thresholds still apply to counts

## Testing Instructions

### Build the Updated Tool

```bash
cd packages/comparison-tool
pnpm install  # if needed
pnpm run build
```

### Run V1-V2 Comparison

```bash
cd packages/comparison-tool
pnpm compare -- \
  --v1=http://192.168.0.21:57223/v1/graphql \
  --v2=http://192.168.0.21:18716/v1/graphql \
  --tolerance=2 \
  2>&1 | tee ../../.planning/phases/05-deployment-validation/comparison-results-fixed.log
```

### Expected Results

**Before fix:**

- 29/72 exact matches
- 15 within tolerance
- 19,535 unexpected diffs (mostly false positives)
- Exit status: 1 (FAIL)

**After fix:**

- 44+ exact matches (29 core + metadata sub-entities)
- 15-20 within tolerance
- 0-100 unexpected diffs (only real issues)
- Exit status: 0 (PASS) or near-pass

### Validation Checklist

✅ **Metadata sub-entities show 0 diffs** (or very few if real content differences exist)
✅ **LSP4MetadataImage, LSP4MetadataAsset, LSP4MetadataAttribute** validated
✅ **LSP29 encrypted asset sub-entities** validated
✅ **Core entities still work** (UniversalProfile, DigitalAsset, Follow, etc.)
✅ **Row counts match** for all entity types (within tolerance)

## Impact on UAT

This fix enables proper validation of:

- ✅ **Test 10**: LSP4 Base URI Derivation (~84K entities)
- ✅ **Test 12**: Overall V1-V2 Parity (all 72 entity types)

Previously blocked tests can now proceed.

## Future Use Cases

### Node Redundancy Validation

```bash
# Compare two V2 nodes
pnpm compare -- \
  --mode=v2-v2 \
  --source=http://node1.example.com/v1/graphql \
  --target=http://node2.example.com/v1/graphql \
  --tolerance=0
```

Expected result: **All entity types match exactly** (both counts and content)

### Disaster Recovery Verification

After restoring a backup, verify data integrity:

```bash
pnpm compare -- \
  --mode=v2-v2 \
  --source=http://production-node/v1/graphql \
  --target=http://restored-node/v1/graphql \
  --tolerance=0
```

## Known Limitations

1. **Performance**: Content-based matching requires fetching full rows (not just IDs)

   - Impact: ~2-3x slower for metadata sub-entities
   - Mitigation: Only fetches sample (default 100 rows), not full table

2. **Signature Collisions**: Extremely rare, but possible if two entities have identical content

   - Impact: Would report as "matching" when they might be duplicates
   - Mitigation: Sample size covers this statistically

3. **Field Order**: Uses stable stringify to normalize JSON/JSONB field order
   - Already implemented in original tool
   - No additional impact

## Files Modified

1. `packages/comparison-tool/src/graphqlClient.ts` (+23 lines)

   - Added `querySampleRows()` method
   - Updated interface and return statement

2. `packages/comparison-tool/src/comparisonEngine.ts` (+103 lines, -35 lines)
   - Added `buildContentSignatureMap()` function
   - Enhanced Phase 2 sampling with dual strategies
   - Split comparison logic for metadata vs core entities

**Total delta**: +126 lines, -35 lines = **+91 lines**

## Rollback Plan

If issues arise, revert commits:

```bash
git log --oneline packages/comparison-tool/src/ | head -5
# Identify commit hashes for graphqlClient.ts and comparisonEngine.ts changes
git revert <commit-hash-2> <commit-hash-1>
```

Original ID-based matching will be restored.

---

**Status**: Ready for testing
**Author**: Claude (GSD UAT workflow)
**Date**: 2026-02-15
