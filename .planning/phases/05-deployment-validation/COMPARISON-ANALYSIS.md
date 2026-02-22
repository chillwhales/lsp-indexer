# Comparison Results Analysis

## Test Run: comparison-fixed.log

**Date**: 2026-02-15
**Branch tested**: `refactor/indexer-v2` (epic branch - DOES NOT have comparison tool fix)
**Expected branch**: `fix/comparison-tool-content-matching` (has PR #173 fixes)

## Results

```
Mode: v1-v2
Entity types compared: 72
Row count exact matches: 29/72
Within tolerance: +15
Metadata timing: 23
Unexpected diffs: 19,535 ❌
Exit code: 1 (FAIL)
```

## Problem Identified

The user tested the comparison tool from the **wrong branch**.

### What Happened

1. ✅ PR #173 created with comparison tool fix (on branch `fix/comparison-tool-content-matching`)
2. ❌ User ran comparison from `refactor/indexer-v2` branch (epic branch WITHOUT the fix)
3. ❌ Result: Same 19,535 diffs as before (fix not applied)

### Evidence

- Git log shows last commit to `comparisonEngine.ts` on `refactor/indexer-v2` is `7a6615b` (old code)
- PR #173 has commits `4e14a6d` and `28e4233` with the fix (on feature branch)
- Comparison output still shows `→ undefined` pattern (ID-based sampling failing)

## Root Cause of Diffs

Looking at the diff patterns, the real issue is **NOT** the comparison tool's matching strategy.

### Pattern in Diffs

All diffs show this pattern:

```
Row: {id}
  field1: "value" → undefined
  field2: "value" → undefined
  field3: "value" → undefined
```

This means:

- V1 query returns rows successfully
- V2 query returns EMPTY (not "different UUIDs", but literally no rows)

### Hypothesis

**The comparison tool ISN'T the problem - V2 might actually be missing data!**

But wait - manual GraphQL test shows V2 HAS the data:

```bash
curl V2 for universal_profile id="0x0000002a62b213fcbe7c46835536f10bc69dce3c"
→ Returns: { id, address, lsp3_profile_id: null } ✓ EXISTS
```

So V2 has the data, but the comparison tool's V2 queries return empty...

### Actual Root Cause

**The comparison tool on `refactor/indexer-v2` has a bug in how it queries V2.**

Looking at row counts:

- Follow: V1=122,870 vs V2=61,738 (49% diff - **real issue!**)
- Follower: V1=N/A vs V2=60,035 (new entity in V2)
- LSP4Metadata: V1=116,992 vs V2=123,670 (5.4% diff)

These count mismatches are REAL, not comparison tool bugs.

But the `→ undefined` diffs suggest the tool is sampling from one dataset and not finding those exact IDs in the other.

## Next Steps

### Option 1: Merge PR #173 and Re-Test

```bash
# On GitHub: Merge PR #173 into refactor/indexer-v2
git checkout refactor/indexer-v2
git pull origin refactor/indexer-v2
cd packages/comparison-tool
pnpm run build
pnpm compare -- --v1=... --v2=... --tolerance=2
```

**Expected result**: Fewer diffs (metadata sub-entities will match by content)

### Option 2: Test from Feature Branch Now

```bash
git checkout fix/comparison-tool-content-matching
cd packages/comparison-tool
pnpm compare -- --v1=... --v2=... --tolerance=2
```

**Expected result**: Should show improved results if fix works

### Option 3: Investigate Real Data Issues

The row count mismatches are REAL problems that need investigation:

**Critical Issues**:

1. **Follow**: V2 has only 50% of V1's rows (61K vs 122K) ❌

   - Phase 5.1 was supposed to fix this (pipeline address filter bug)
   - Why is V2 still missing ~61K Follow entities?

2. **Follower**: V2 has 60K rows, V1 has table missing

   - Is this a V2-only entity? Check schema

3. **LSP4Metadata**: V2 has 5.4% MORE than V1 (123K vs 116K)

   - Should be similar after base URI derivation fix
   - Need to investigate why V2 has extra rows

4. **LSP29 sub-entities**: V2 has ZERO for all sub-entities

   - Title, Description, File, Encryption, etc. all show 0 in V2
   - V1 has 9+ rows for each
   - **This is a MAJOR bug in V2's LSP29 metadata fetch handler**

5. **LSP4MetadataCategory**: V2 has only 616 vs V1's 90,911 (99.3% missing!) ❌

   - Catastrophic data loss
   - Need to investigate LSP4 metadata fetch handler

6. **New entities in V2** (V1 missing):
   - Follower, LSP29EncryptedAssetEntry, LSP4Creator, LSP5ReceivedAsset, LSP6Controller, LSP12IssuedAsset
   - These might be intentional V2 improvements

## Recommendation

**DO NOT proceed with Phase 5 UAT until these data issues are resolved:**

1. ❌ **Merge PR #173** - comparison tool fix is ready
2. ❌ **Re-test comparison** - verify tool works correctly
3. ❌ **Investigate Follow count mismatch** - why is V2 missing 50% of Follow entities?
4. ❌ **Investigate LSP29 sub-entities** - why are ALL sub-entities zero in V2?
5. ❌ **Investigate LSP4MetadataCategory** - why is 99% missing in V2?
6. ❌ **Fix identified bugs** - create new phase/plans as needed
7. ✅ **Re-index V2 from scratch** - after fixes applied
8. ✅ **Re-run comparison** - should show <100 diffs
9. ✅ **Complete Phase 5 UAT** - validate all fixes working

## Critical Bugs Found

### Bug 1: Follow Entity Count Mismatch (50% missing)

**Symptom**: V2 has 61,738 Follow entities vs V1's 122,870
**Expected**: Should match after Phase 5.1 pipeline address filter fix
**Root cause**: Unknown - needs investigation
**Severity**: BLOCKER

### Bug 2: LSP29 Sub-Entities All Zero

**Symptom**: All LSP29 sub-entity types show 0 rows in V2 (V1 has 9+)
**Affected entities**:

- LSP29EncryptedAssetTitle: 0 (V1: 9)
- LSP29EncryptedAssetDescription: 0 (V1: 9)
- LSP29EncryptedAssetFile: 0 (V1: 9)
- LSP29EncryptedAssetEncryption: 0 (V1: 9)
- LSP29AccessControlCondition: 0 (V1: 9)
- LSP29EncryptedAssetChunks: 0 (V1: 9)
- LSP29EncryptedAssetImage: 0 (V1: 32)

**Root cause**: LSP29 metadata fetch handler not creating sub-entities
**Severity**: BLOCKER

### Bug 3: LSP4MetadataCategory 99% Missing

**Symptom**: V2 has only 616 rows vs V1's 90,911 (99.32% missing)
**Root cause**: LSP4 metadata fetch handler not creating Category entities
**Severity**: BLOCKER

### Bug 4: Follow vs Follower Schema Mismatch

**Symptom**: V1 has Follow table, V2 has both Follow + Follower
**Root cause**: Schema change between V1 and V2?
**Severity**: Investigate - might be intentional improvement

---

**Status**: UAT BLOCKED - critical data bugs must be fixed before validation can proceed
**Next**: Merge PR #173, investigate bugs, create fix plans, re-index, re-test
