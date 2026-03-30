---
id: T01
parent: S04
milestone: M007
provides: []
requires: []
affects: []
key_files: ["apps/docs/src/app/docs/node/page.mdx", "apps/docs/src/app/(home)/page.mdx"]
key_decisions: ["Modeled Collection Attributes docs section after Batch Encrypted Asset Fetch section for consistency", "Placed NFT include/filter/sort docs as subsections under Include Fields"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "All 5 grep checks passed: fetchCollectionAttributes, collectionAttributeKeys, Collection Attributes on home page, chillClaimed, and NftSortField all present in the expected files."
completed_at: 2026-03-30T11:28:54.848Z
blocker_discovered: false
---

# T01: Added Collection Attributes section, NFT chillwhales include/filter/sort field docs to node page, and Collection Attributes row to home page Supported Domains table

> Added Collection Attributes section, NFT chillwhales include/filter/sort field docs to node page, and Collection Attributes row to home page Supported Domains table

## What Happened
---
id: T01
parent: S04
milestone: M007
key_files:
  - apps/docs/src/app/docs/node/page.mdx
  - apps/docs/src/app/(home)/page.mdx
key_decisions:
  - Modeled Collection Attributes docs section after Batch Encrypted Asset Fetch section for consistency
  - Placed NFT include/filter/sort docs as subsections under Include Fields
duration: ""
verification_result: passed
completed_at: 2026-03-30T11:28:54.848Z
blocker_discovered: false
---

# T01: Added Collection Attributes section, NFT chillwhales include/filter/sort field docs to node page, and Collection Attributes row to home page Supported Domains table

**Added Collection Attributes section, NFT chillwhales include/filter/sort field docs to node page, and Collection Attributes row to home page Supported Domains table**

## What Happened

Updated node docs page with four additions: Collection Attributes row in fetch functions table, new Collection Attributes section with parameters/usage/behavioral notes, collectionAttributeKeys in key factories, and three NFT subsections (7 include fields, 4 filter fields, score sort field). Updated home page Supported Domains table with Collection Attributes row (list-only).

## Verification

All 5 grep checks passed: fetchCollectionAttributes, collectionAttributeKeys, Collection Attributes on home page, chillClaimed, and NftSortField all present in the expected files.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `grep -q 'fetchCollectionAttributes' apps/docs/src/app/docs/node/page.mdx && grep -q 'collectionAttributeKeys' apps/docs/src/app/docs/node/page.mdx && grep -q 'Collection Attributes' apps/docs/src/app/(home)/page.mdx && grep -q 'chillClaimed' apps/docs/src/app/docs/node/page.mdx && grep -q 'NftSortField' apps/docs/src/app/docs/node/page.mdx` | 0 | ✅ pass | 500ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/docs/src/app/docs/node/page.mdx`
- `apps/docs/src/app/(home)/page.mdx`


## Deviations
None.

## Known Issues
None.
