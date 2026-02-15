# Re-Test Instructions: Comparison Tool Fix Applied

## What Was Fixed

The comparison tool now supports **content-based matching** for metadata sub-entities with random UUIDs.

**Commit**: `51ea57f`

## Next Steps

### 1. Build the Updated Comparison Tool

On your machine (192.168.0.21), navigate to the comparison tool and rebuild:

```bash
cd /path/to/lsp-indexer/packages/comparison-tool
pnpm install  # if needed
pnpm run build
```

### 2. Run the Fixed Comparison

```bash
cd packages/comparison-tool
pnpm compare -- \
  --v1=http://192.168.0.21:57223/v1/graphql \
  --v2=http://192.168.0.21:18716/v1/graphql \
  --tolerance=2 \
  2>&1 | tee ../../.planning/phases/05-deployment-validation/comparison-fixed.log
```

### 3. Expected Results

**Before fix** (from your previous run):

- ✗ 29/72 exact matches
- ≈ 15 within tolerance
- ✗ 19,535 unexpected diffs
- ✗ Exit status 1 (FAIL)

**After fix** (expected):

- ✓ 44+/72 exact matches (added ~15 metadata sub-entity types)
- ≈ 15-20 within tolerance
- ✓ 0-100 unexpected diffs (only real issues, if any)
- ✓ Exit status 0 (PASS) or near-pass

### 4. What to Look For

#### ✅ Success Indicators

1. **Metadata sub-entities show matching**:

   - `LSP4MetadataImage`: ✓ MATCH or ≈ TOLERANCE
   - `LSP4MetadataAsset`: ✓ MATCH or ≈ TOLERANCE
   - `LSP4MetadataAttribute`: ✓ MATCH or ≈ TOLERANCE
   - `LSP29EncryptedAssetImage`: ✓ MATCH or ≈ TOLERANCE
   - etc.

2. **No more "undefined" fields in diff output**

   - Previously showed: `url: "ipfs://..." → undefined`
   - Now should: Either match exactly, or show real field differences

3. **Significantly fewer unexpected diffs**

   - Down from 19,535 to <100

4. **Phase 5.1-5.3 fixes validated**:
   - `Follow`: >100K rows (was 0)
   - `Unfollow`: >2K rows (was 0)
   - `DeployedERC1167Proxies`: >35K rows (was 0)
   - `UniversalProfileOwner`: Matches V1 count
   - `DigitalAssetOwner`: Matches V1 count
   - `ChillClaimed`: Matches V1 count
   - `OrbsClaimed`: Matches V1 count
   - `OwnedAsset`: Within 2% of V1 (not 14K over)
   - `LSP4Metadata`: ~116K rows (was ~32K missing base URI entities)

#### ⚠️ Issues That Might Still Appear

Some entity types may still show differences. These could be:

1. **Known V1 divergences** (expected, OK):

   - `LSP8ReferenceContract`: V1 switch fall-through bug
   - Should be flagged in output as "known divergence"

2. **LSP6 permission data** (investigate if differs):

   - `LSP6ControllersLength`: May show timestamp differences
   - `LSP6Permission`: Field-level diffs
   - `LSP6AllowedCall`: Field-level diffs
   - Check if these are real bugs or timing differences

3. **LSP29 encrypted assets** (investigate if differs):
   - `LSP29EncryptedAsset`: May show version/revision diffs
   - Check if content fetching differences vs structural issues

### 5. Copy the Output

After the comparison completes:

```bash
# The output is already logged to comparison-fixed.log
# Copy it to the UAT directory for analysis
cat ../../.planning/phases/05-deployment-validation/comparison-fixed.log
```

### 6. Report Back

Send the comparison output (especially the summary section at the end) back to me. I'll analyze:

1. Which tests now pass
2. Which tests still have issues
3. Whether remaining issues are real bugs or expected divergences

## Quick Validation

If you want a quick check before the full comparison:

```bash
# Test content-based matching on just LSP4MetadataImage
cd packages/comparison-tool
pnpm compare -- \
  --v1=http://192.168.0.21:57223/v1/graphql \
  --v2=http://192.168.0.21:18716/v1/graphql \
  --entities=LSP4MetadataImage \
  --sample-size=50 \
  --tolerance=2
```

**Expected**: ✓ MATCH or ≈ TOLERANCE with 0 unexpected diffs

## Troubleshooting

### If build fails:

```bash
# Clean and rebuild
cd packages/comparison-tool
rm -rf lib/
pnpm run clean
pnpm run build
```

### If comparison still shows 19K diffs:

1. Verify you rebuilt after pulling commit `51ea57f`
2. Check `lib/comparisonEngine.js` exists and has recent timestamp
3. Try `pnpm run clean && pnpm run build` again

### If comparison crashes:

Check the error message. Common issues:

- GraphQL endpoint down: Verify both V1 and V2 are running
- Admin secret wrong: Double-check credentials
- TypeScript error: Run `pnpm run build` to see compilation errors

## After Testing

Once you have results, we'll:

1. Update UAT.md with actual test results
2. Mark tests as pass/fail/issue
3. If issues remain, diagnose and plan fixes
4. Complete Phase 5 validation

---

**Ready to test!** Let me know what you see in the comparison output.
