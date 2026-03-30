# S04 — Research

**Date:** 2026-03-30

## Summary

S04 is documentation + final build verification. All code changes landed in S01–S03. The docs app has 5 MDX pages, none of which mention any chillwhales-specific fields, collection attributes, or the new filter/sort additions. The home page's supported-domains table also lacks a Collection Attributes row.

This is light research — the pattern for docs updates is already established across every page, and the changes are additive (new sections, new table rows, new code examples). No technology research or library lookups needed.

## Recommendation

Three tasks: (1) update node docs, (2) update react + next docs, (3) home page domain table + final full build verification. Tasks 1 and 2 are independent and could be parallel, but sequential is fine for a low-risk slice.

## Implementation Landscape

### Key Files

- `apps/docs/src/app/docs/node/page.mdx` (262 lines) — needs: `fetchCollectionAttributes` in fetch functions table, new "Collection Attributes" section (similar to "Batch Encrypted Asset Fetch"), `collectionAttributeKeys` in key factories section, mention of new NFT include fields (score, rank, chillClaimed, etc.), new NftFilter fields, new NftSortField `score`
- `apps/docs/src/app/docs/react/page.mdx` (416 lines) — needs: `useCollectionAttributes` in Available Domains table, new "Collection Attributes" section, mention of new NFT include fields in the Include Fields section or a new NFT-specific example, new filter/sort fields in Filters and Sorting section
- `apps/docs/src/app/docs/next/page.mdx` (418 lines) — needs: `getCollectionAttributes` in server actions table, `useCollectionAttributes` in hooks table, new "Collection Attributes" section, mention of new NFT include/filter/sort fields
- `apps/docs/src/app/(home)/page.mdx` — needs: "Collection Attributes" row in Supported Domains table (no Single, List only, no Infinite, no Subscription)

### What to Document per Page

**node/page.mdx:**
1. Add `Collection Attributes` row to fetch functions table: `—` for Single, `fetchCollectionAttributes` for List
2. New section "## Collection Attributes" explaining `fetchCollectionAttributes(url, { collectionAddress })` with usage example and return shape `{ attributes: CollectionAttribute[], totalCount: number }`
3. Add `collectionAttributeKeys` mention in key factories section
4. Document new NFT include fields somewhere visible — either a dedicated subsection or a note in the Include Fields section listing: `score`, `rank`, `chillClaimed`, `orbsClaimed`, `level`, `cooldownExpiry`, `faction`
5. Document new NftFilter fields: `chillClaimed`, `orbsClaimed`, `maxLevel`, `cooldownExpiryBefore`
6. Document NftSortField `score`

**react/page.mdx:**
1. Add `Collection Attributes` row to Available Domains table with `useCollectionAttributes`
2. New section "## Collection Attributes" with usage example
3. Mention new NFT include fields — update Include Fields example or add NFT-specific example
4. Mention new NftFilter fields and `score` sort in Filters and Sorting section

**next/page.mdx:**
1. Add `Collection Attributes` row to server actions table: `getCollectionAttributes`
2. Add `Collection Attributes` row to hooks table (if there's a separate hooks table)
3. New section "## Collection Attributes" with server action + hook usage
4. Mention new NFT include/filter/sort fields

**(home)/page.mdx:**
1. Add `Collection Attributes` row to Supported Domains table: `—`, `✓`, `—`, `—`

### Build Order

1. Update all docs pages (independent of each other — no cross-page dependencies)
2. Run `pnpm build` for final full-stack verification (all 9 workspace projects)
3. Verify docs app generates all static pages (currently 22, may increase)

### Verification

- `pnpm build` exits 0 across all 9 projects
- Docs app static generation succeeds (check for "Generating static pages" in build output)
- Each docs page is valid MDX (build catches syntax errors)

### Constraints

- AGENTS.md documentation matrix requires updating specific docs pages for each change type
- MDX pages use standard markdown tables and fenced code blocks — no custom components needed
- Existing patterns (Batch Encrypted Asset Fetch, Mutual Follow Queries sections) serve as templates for the Collection Attributes sections
