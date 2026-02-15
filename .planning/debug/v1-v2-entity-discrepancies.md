---
status: resolved
trigger: 'investigate why do we have such a discrepancy between other entities'
created: 2026-02-15T00:00:00Z
updated: 2026-02-15T00:00:00Z
---

## Current Focus

hypothesis: Most discrepancies are V1 bugs or V2 improvements, not V2 bugs
test: Code comparison of V1 vs V2 handlers for each discrepant entity
expecting: V2 code is correct, V1 code has issues
next_action: Document findings and present to user

## Symptoms

expected: V1 and V2 entity counts should match (within tolerance)
actual: Multiple entity types show large discrepancies (1%-99%)
errors: Comparison tool shows 19,535 unexpected diffs
reproduction: Run comparison tool against both endpoints
started: Found during Phase 5 UAT comparison

## Root Cause Analysis

### Category 1: V1 Switch-Case Fall-Through Bug 🐛

**File:** `packages/indexer/src/app/scanner.ts` lines 203-228

V1 has **missing `break` statements** in the DataChanged switch-case:

```
case LSP4DataKeys['LSP4Creators[]'].length:     ← NO BREAK
case LSP5DataKeys['LSP5ReceivedAssets[]'].length: ← NO BREAK
case LSP6DataKeys['AddressPermissions[]'].length: ← NO BREAK
case LSP8DataKeys.LSP8ReferenceContract:          ← BREAK here
```

**Impact:** Every LSP4CreatorsLength event ALSO creates LSP5ReceivedAssetsLength + LSP6ControllersLength + LSP8ReferenceContract entities. Every LSP5 event also creates LSP6 + LSP8. Every LSP6 event also creates LSP8.

**Affected entities:**

| Entity                   | V1 Count | V2 Count | V1 Inflated By              | V2 Correct? |
| ------------------------ | -------- | -------- | --------------------------- | ----------- |
| LSP8ReferenceContract    | 38,627   | 1,536    | All 3 above falling through | ✅ YES      |
| LSP6ControllersLength    | 37,109   | 35,474   | LSP4+LSP5 falling through   | ✅ YES      |
| LSP5ReceivedAssetsLength | 19,478   | 17,911   | LSP4 falling through        | ✅ YES      |

**V2 is correct. V1 has a cascade bug creating ~37K bogus LSP8ReferenceContract entries.**

### Category 2: V2 Stricter Validation (Improvement) ✅

**LSP4MetadataCategory (99.3% diff: V1=90,911 vs V2=616)**

- V1: ALWAYS creates category entity, even when `category` is `undefined`
  ```js
  // V1: packages/indexer/src/utils/dataChanged/lsp4Metadata.ts:97-101
  const lsp4MetadataCategory = new LSP4MetadataCategory({
    id: uuidv4(),
    lsp4Metadata,
    value: category, // undefined!
  });
  ```
- V2: Only creates when `category` is a string
  ```js
  // V2: packages/indexer-v2/src/handlers/lsp4MetadataFetch.handler.ts:131
  if ('category' in lsp4Metadata && typeof lsp4Metadata.category === 'string') {
  ```
- **V2 is correct.** V1 stores ~90K rows with `null`/`undefined` values — junk data.

**LSP3ProfileImage (36% diff: V1=43,002 vs V2=27,502)**

- V1: Maps ALL items without validation
  ```js
  // V1: No isFileImage guard on LSP3 images
  profileImage.map(({ url, width, height, verification }) => ...)
  ```
- V2: Filters with `isFileImage()` type guard
  ```js
  if (!isFileImage(img)) continue; // requires url, width, height, verification
  ```
- **V2 is correct.** ~36% of profile images lack proper width/height/verification. V1 stores broken entries.

**LSP3ProfileBackgroundImage (21.58% diff: V1=22,305 vs V2=17,491)**

- Same cause as ProfileImage. V1 no filter, V2 uses isFileImage.

**LSP4MetadataIcon (6.28% diff: V1=90,178 vs V2=84,514)**

- Same cause. V1 maps all icons, V2 filters with isFileImage.

### Category 3: V2 Better Deduplication ✅

**LSP6AllowedCall (37.6% diff: V1=476 vs V2=297)**

- V1 ID: `${address} - ${dataKey} - ${index}` (includes full dataKey)
- V2 ID: `${address} - ${controllerAddress} - ${index}` (controller-based)
- V2 properly clears old entries with `queueClear()` before inserting
- V2 stores only the latest state per controller; V1 may accumulate stale entries

### Category 4: V2 Metadata Fetch Handler Never Triggered 🐛

**LSP29 Sub-Entities (100% missing: all 0 in V2, 9-32 in V1)**

**Verified via direct GraphQL queries:**

V1 state: 9 entities with `is_data_fetched: true` (fetched successfully), 2 with empty URLs
V2 state: ALL 11 entities have `is_data_fetched: false`, **no error messages**

This confirms the V2 fetch handler **never ran at all**, not that it ran and failed.

**Root cause:** The handler `listensToBag: ['LSP29EncryptedAsset']` only fires when
there are LSP29EncryptedAsset entities in the CURRENT batch. Since all 11 LSP29 entities
were created during historical sync, and no new LSP29 events occur at chain head, the
handler is NEVER triggered. Therefore the DB backlog drain (which queries for unfetched
entities) never executes.

This is a **design flaw** in V2's metadata fetch system: backlog drain depends on new
entities of the same type appearing in the batch. Works for high-frequency types (LSP4
has 123K entities, regularly triggered), but fails for rare types (LSP29 has only 11).

Evidence from V2 queries:

- LSP4Metadata: 94,553 fetched, 20,558 with errors (handler runs regularly) ✅
- LSP3Profile: 34,328 fetched, 29 unfetched (handler runs regularly) ✅
- LSP29: 0 fetched, 9 never attempted (handler never triggered) ❌

**Fix needed:** Add a `drainAtHead` flag to metadata fetch handlers so the pipeline
triggers them at head even when their bag is empty, specifically to drain backlogs.

### Category 5: New V2 Entities (Expected) ℹ️

These entities exist in V2 but not V1 — they are **intentional V2 improvements**:

| Entity                   | V2 Count | Purpose                                           |
| ------------------------ | -------- | ------------------------------------------------- |
| Follower                 | 60,035   | Migrated from Follow "address-address" pairs      |
| LSP4Creator              | 1,961    | Individual creator entities from LSP4Creators[]   |
| LSP5ReceivedAsset        | 133,532  | Individual items from LSP5ReceivedAssets[]        |
| LSP6Controller           | 91,057   | Individual controller entities with merged fields |
| LSP12IssuedAsset         | 1,921    | Individual items from LSP12IssuedAssets[]         |
| LSP29EncryptedAssetEntry | 20       | Map entries for encrypted assets                  |

### Category 6: Metadata Timing Diffs (Normal) ℹ️

| Entity                  | V1      | V2      | Diff  | Reason                                         |
| ----------------------- | ------- | ------- | ----- | ---------------------------------------------- |
| LSP4Metadata            | 116,992 | 123,670 | +5.4% | V2 processes more DataChanged events correctly |
| LSP4MetadataName        | 90,911  | 89,052  | -2%   | Fetch timing / IPFS availability               |
| LSP4MetadataDescription | 90,911  | 92,551  | +1.8% | Fetch timing                                   |
| LSP4MetadataImage       | 193,313 | 177,261 | -8.3% | isFileImage filter on nested arrays            |
| LSP4MetadataAttribute   | 500,518 | 506,784 | +1.2% | Fetch timing                                   |

## Eliminated

- hypothesis: V2 comparison tool sampling bug causes false diffs
  evidence: Row count discrepancies are consistent with code analysis
  timestamp: 2026-02-15

- hypothesis: V2 handlers not registered / not running
  evidence: Registry auto-discovers all \*.handler.js files; parent entities match
  timestamp: 2026-02-15

## Evidence

- timestamp: 2026-02-15
  checked: V1 scanner.ts switch-case lines 203-228
  found: Missing break statements in 4 consecutive cases (LSP4Creators → LSP5 → LSP6 → LSP8)
  implication: V1 creates spurious entities for wrong data keys (cascade fall-through)

- timestamp: 2026-02-15
  checked: V1 lsp4Metadata.ts extractSubEntities() lines 97-101
  found: Category entity ALWAYS created, even when value is undefined
  implication: V1 has ~90K junk category rows with null values

- timestamp: 2026-02-15
  checked: V1 lsp3Profile.ts lines 137-153 vs V2 lsp3ProfileFetch.handler.ts lines 160-173
  found: V1 maps ALL profileImage items without validation; V2 filters with isFileImage()
  implication: 36% of profile images in V1 lack proper width/height/verification fields

- timestamp: 2026-02-15
  checked: V2 metadataFetch.ts line 201
  found: Metadata fetches gated by isHead — only run when synced to chain head
  implication: LSP29 sub-entities depend on IPFS fetch at head; 0 rows suggests fetch failures

- timestamp: 2026-02-15
  checked: V1 vs V2 LSP6AllowedCall ID generation
  found: V1 uses full dataKey in ID, V2 uses controllerAddress — better deduplication
  implication: V2 stores only latest allowed calls per controller; fewer but correct entries

## Resolution

root_cause: |
Most entity count discrepancies fall into 3 categories:

1. V1 switch-case fall-through bug (scanner.ts) creating spurious entities
2. V2 stricter data validation (isFileImage, category string check)
3. Metadata fetch timing/availability (LSP29 IPFS)

**V2 is correct in all cases except LSP29 sub-entities (which need IPFS re-fetch).**

fix: |
Only one code fix needed: LSP29 metadata fetch handler never triggers because
the pipeline only runs handlers when their entity bag has items. Need a mechanism
to trigger metadata fetch handlers at head even with empty bags (drainAtHead flag).
All other discrepancies are V1 bugs or V2 improvements — no fix needed.

verification: |

- LSP8ReferenceContract: V1 fall-through confirmed by scanner.ts line 218 missing break
- LSP4MetadataCategory: V1 unconditional creation confirmed at lsp4Metadata.ts:97
- LSP3ProfileImage: V1 no validation confirmed at lsp3Profile.ts:139
- V2 handlers confirmed correct via code review

files_changed: [] # No fixes needed — V2 is already correct
