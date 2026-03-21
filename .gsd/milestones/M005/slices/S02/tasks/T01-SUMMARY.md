---
id: T01
parent: S02
milestone: M005
provides:
  - Batch encrypted asset API documentation across node, react, and next docs pages
key_files:
  - apps/docs/src/app/docs/node/page.mdx
  - apps/docs/src/app/docs/react/page.mdx
  - apps/docs/src/app/docs/next/page.mdx
key_decisions: []
patterns_established:
  - Batch API docs follow the same structure as "Batch Follow Checking" sections (params table + usage + notes)
observability_surfaces:
  - grep checks for batch function names in docs pages confirm documentation presence
duration: 10m
verification_result: passed
completed_at: 2026-03-21
blocker_discovered: false
---

# T01: Add batch encrypted asset documentation to all three docs pages

**Added fetchEncryptedAssetsBatch, useEncryptedAssetsBatch, and getEncryptedAssetsBatch documentation to node, react, and next docs pages with params tables and usage examples**

## What Happened

Updated all three docs pages following the established "Batch Follow Checking" pattern from M003:

1. **Node docs**: Updated the fetch functions table to include `fetchEncryptedAssetsBatch` in the Encrypted Assets row. Added an "Additional" note below the table. Added a full "Batch Encrypted Asset Fetch" section with parameter table (`tuples`, `include`), usage code block, and notes about empty-tuple short-circuit and case-insensitive matching. Added `encryptedAssetKeys.batch(tuples, include)` to the Query Key Factories section.

2. **React docs**: Updated the Available Domains table to include `useEncryptedAssetsBatch` in the Encrypted Assets row. Added a "Batch Encrypted Asset Fetch" section after the "Batch Follow Checking" section with parameter table, usage code block, and notes about disabled-when-empty behavior and no `totalCount`.

3. **Next.js docs**: Updated the server actions table to include `getEncryptedAssetsBatch`. Added a "Batch Encrypted Asset Fetch" section after the "Batch Follow Checking" section with usage code block and notes about Zod validation and hidden Hasura URL.

## Verification

All 6 grep checks pass confirming batch API names appear in the correct docs pages.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `grep -q "fetchEncryptedAssetsBatch" apps/docs/src/app/docs/node/page.mdx` | 0 | ✅ pass | <1s |
| 2 | `grep -q "useEncryptedAssetsBatch" apps/docs/src/app/docs/react/page.mdx` | 0 | ✅ pass | <1s |
| 3 | `grep -q "useEncryptedAssetsBatch" apps/docs/src/app/docs/next/page.mdx` | 0 | ✅ pass | <1s |
| 4 | `grep -q "EncryptedAssetBatchTuple" apps/docs/src/app/docs/react/page.mdx` | 0 | ✅ pass | <1s |
| 5 | `grep -q "getEncryptedAssetsBatch" apps/docs/src/app/docs/next/page.mdx` | 0 | ✅ pass | <1s |
| 6 | `grep -q "encryptedAssetKeys" apps/docs/src/app/docs/node/page.mdx` | 0 | ✅ pass | <1s |

### Slice-level verification (partial — T01 is not the final task)

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `grep -q "fetchEncryptedAssetsBatch" apps/docs/src/app/docs/node/page.mdx` | 0 | ✅ pass | <1s |
| 2 | `grep -q "useEncryptedAssetsBatch" apps/docs/src/app/docs/react/page.mdx` | 0 | ✅ pass | <1s |
| 3 | `grep -q "useEncryptedAssetsBatch" apps/docs/src/app/docs/next/page.mdx` | 0 | ✅ pass | <1s |
| 4 | `ls .changeset/add-encrypted-assets-batch.md` | 2 | ⏳ skip (T02) | <1s |
| 5 | `grep -q "@lsp-indexer/types" .changeset/add-encrypted-assets-batch.md` | — | ⏳ skip (T02) | — |
| 6 | `pnpm build` | — | ⏳ skip (T02) | — |

## Diagnostics

Grep for `fetchEncryptedAssetsBatch`, `useEncryptedAssetsBatch`, `getEncryptedAssetsBatch`, or `EncryptedAssetBatchTuple` in the docs pages to confirm documentation presence. If docs build fails in T02, check MDX syntax in the edited files.

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/docs/src/app/docs/node/page.mdx` — Added batch fetch function to table, "Batch Encrypted Asset Fetch" section, and key factory entry
- `apps/docs/src/app/docs/react/page.mdx` — Added batch hook to domain table and "Batch Encrypted Asset Fetch" section
- `apps/docs/src/app/docs/next/page.mdx` — Added batch server action to table and "Batch Encrypted Asset Fetch" section
- `.gsd/milestones/M005/slices/S02/S02-PLAN.md` — Added Observability section, marked T01 done
