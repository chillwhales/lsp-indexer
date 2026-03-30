---
id: S04
parent: M007
milestone: M007
provides:
  - Complete M007 documentation coverage across all 4 docs surfaces
requires:
  - slice: S01
    provides: NftInclude, NftSortField, Lsp4Attribute type definitions
  - slice: S02
    provides: NftFilter, OwnedTokenNftInclude type definitions
  - slice: S03
    provides: fetchCollectionAttributes, useCollectionAttributes, getCollectionAttributes
affects:
  []
key_files:
  - apps/docs/src/app/docs/node/page.mdx
  - apps/docs/src/app/docs/react/page.mdx
  - apps/docs/src/app/docs/next/page.mdx
  - apps/docs/src/app/(home)/page.mdx
key_decisions:
  - Modeled Collection Attributes docs section after Batch Encrypted Asset Fetch section for consistency across all docs pages
  - Placed NFT include/filter/sort docs as dedicated subsections rather than inlining into generic sections
patterns_established:
  - (none)
observability_surfaces:
  - none
drill_down_paths:
  - .gsd/milestones/M007/slices/S04/tasks/T01-SUMMARY.md
  - .gsd/milestones/M007/slices/S04/tasks/T02-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-30T11:33:37.805Z
blocker_discovered: false
---

# S04: Docs + verification

**Updated all 4 docs pages with Collection Attributes domain, NFT chillwhales include/filter/sort fields, and verified full 9-project workspace build clean (22/22 static pages).**

## What Happened

S04 documented all new types, hooks, filters, sort fields, and server actions introduced in S01–S03 across the four docs surfaces (node, react, next, home), then verified the full workspace build.

T01 updated the node docs page with four additions: Collection Attributes row in the fetch functions table, a new Collection Attributes section modeled after the Batch Encrypted Asset Fetch pattern (parameters table, usage code block, behavioral notes), collectionAttributeKeys in the key factories section, and three NFT subsections covering the 7 new include fields (score, rank, chillClaimed, orbsClaimed, level, cooldownExpiry, faction), 4 new filter fields (chillClaimed, orbsClaimed, maxLevel, cooldownExpiryBefore), and score sort field. The home page Supported Domains table gained a Collection Attributes row (list-only).

T02 updated react and next docs pages with matching Collection Attributes sections (useCollectionAttributes hook, getCollectionAttributes server action), NFT include/filter/sort subsections, and ran the full workspace build. All 9 projects compiled successfully, and static page generation produced 22/22 pages with no errors.

## Verification

1. Grep checks — all 8 content assertions pass: fetchCollectionAttributes in node docs, collectionAttributeKeys in node docs, Collection Attributes on home page, chillClaimed in node docs, NftSortField in node docs, useCollectionAttributes in react docs, getCollectionAttributes in next docs, chillClaimed in react docs.
2. Full workspace build — pnpm build exits 0 across all 9 workspace projects (types, node, react, next, docs + 4 others). 22/22 static pages generated successfully.

## Requirements Advanced

- R025 — Full 9-project workspace build passes clean — all type changes propagate through types → node → react → next
- R026 — All 4 docs pages updated with Collection Attributes domain, NFT include/filter/sort fields; 22/22 static pages build

## Requirements Validated

- R025 — pnpm build exits 0 across all 9 workspace projects
- R026 — 8 grep content checks pass + 22/22 static pages generated

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None.

## Known Limitations

None.

## Follow-ups

None.

## Files Created/Modified

- `apps/docs/src/app/docs/node/page.mdx` — Added Collection Attributes section, collectionAttributeKeys, NFT include/filter/sort field documentation
- `apps/docs/src/app/(home)/page.mdx` — Added Collection Attributes row to Supported Domains table
- `apps/docs/src/app/docs/react/page.mdx` — Added Collection Attributes section with useCollectionAttributes, NFT include/filter/sort documentation
- `apps/docs/src/app/docs/next/page.mdx` — Added Collection Attributes section with getCollectionAttributes server action + hook, NFT include/filter/sort documentation
