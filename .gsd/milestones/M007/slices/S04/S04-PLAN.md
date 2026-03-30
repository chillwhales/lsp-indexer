# S04: Docs + verification

**Goal:** Docs pages reflect all new types, hooks, filters, sort fields, and server actions from S01–S03. Full workspace build verified clean.
**Demo:** After this: After this: docs pages reflect all new types, hooks, filters, sort fields. Full 5-package build verified clean.

## Tasks
- [x] **T01: Added Collection Attributes section, NFT chillwhales include/filter/sort field docs to node page, and Collection Attributes row to home page Supported Domains table** — Update `apps/docs/src/app/docs/node/page.mdx` with all new S01–S03 content: fetchCollectionAttributes in fetch functions table, new Collection Attributes section (similar to existing Batch Encrypted Asset Fetch section), collectionAttributeKeys in key factories section, NFT include fields (score, rank, chillClaimed, orbsClaimed, level, cooldownExpiry, faction), NftFilter fields (chillClaimed, orbsClaimed, maxLevel, cooldownExpiryBefore), NftSortField score. Also add Collection Attributes row to home page Supported Domains table.

Steps:
1. Read `apps/docs/src/app/docs/node/page.mdx` and identify insertion points for each addition.
2. Add `Collection Attributes` row to the fetch functions table: `—` for Single, `fetchCollectionAttributes` for List.
3. Add a new `## Collection Attributes` section after the Batch Encrypted Asset Fetch section. Model it on the Batch Encrypted Asset Fetch section structure — parameters table, usage code block, behavioral notes. Document `fetchCollectionAttributes(url, { collectionAddress })` returning `{ attributes: CollectionAttribute[], totalCount: number }`.
4. Add `collectionAttributeKeys` to the key factories section with example: `collectionAttributeKeys.list(collectionAddress)`.
5. Add a note about new NFT include fields somewhere visible — either in the Include Fields section or as a new subsection. List all 7: score, rank, chillClaimed, orbsClaimed, level, cooldownExpiry, faction. Show a brief usage example with `fetchNfts` using `include: { score: true, rank: true }`.
6. Document new NftFilter fields (chillClaimed, orbsClaimed, maxLevel, cooldownExpiryBefore) and NftSortField `score` — add a brief paragraph or example near the Include Fields section or in the Collection Attributes section footer.
7. Read `apps/docs/src/app/(home)/page.mdx` and add a `Collection Attributes` row to the Supported Domains table with columns: `—`, `✓`, `—`, `—`.
8. Verify both files are valid MDX by checking no syntax errors are introduced.
  - Estimate: 30m
  - Files: apps/docs/src/app/docs/node/page.mdx, apps/docs/src/app/(home)/page.mdx
  - Verify: grep -q 'fetchCollectionAttributes' apps/docs/src/app/docs/node/page.mdx && grep -q 'collectionAttributeKeys' apps/docs/src/app/docs/node/page.mdx && grep -q 'Collection Attributes' apps/docs/src/app/\(home\)/page.mdx && grep -q 'chillClaimed' apps/docs/src/app/docs/node/page.mdx && grep -q 'NftSortField' apps/docs/src/app/docs/node/page.mdx
- [ ] **T02: Update react + next docs and run final full-workspace build verification** — Update `apps/docs/src/app/docs/react/page.mdx` and `apps/docs/src/app/docs/next/page.mdx` with all new S01–S03 content, then run `pnpm build` to verify the full 9-project workspace builds clean.

Steps:
1. Read `apps/docs/src/app/docs/react/page.mdx` and identify insertion points.
2. Add `Collection Attributes` row to the Available Domains table with `useCollectionAttributes`.
3. Add a new `## Collection Attributes` section after the Mutual Follow Queries section. Show `useCollectionAttributes` usage with `collectionAddress` parameter and return shape `{ attributes, totalCount, isLoading, error }`.
4. Mention new NFT include fields (score, rank, chillClaimed, orbsClaimed, level, cooldownExpiry, faction) in the Include Fields section — add a brief NFT-specific example or note.
5. Mention new NftFilter fields and `score` sort in the Filters and Sorting section.
6. Read `apps/docs/src/app/docs/next/page.mdx` and identify insertion points.
7. Add `Collection Attributes` row to the server actions table: `getCollectionAttributes`.
8. Add a new `## Collection Attributes` section showing both server action and hook usage.
9. Mention new NFT include/filter/sort fields consistent with react docs additions.
10. Run `pnpm build` and verify all 9 workspace projects build clean with exit code 0.
11. Confirm docs static generation succeeds (check for 'Generating static pages' in output).
  - Estimate: 30m
  - Files: apps/docs/src/app/docs/react/page.mdx, apps/docs/src/app/docs/next/page.mdx
  - Verify: grep -q 'useCollectionAttributes' apps/docs/src/app/docs/react/page.mdx && grep -q 'getCollectionAttributes' apps/docs/src/app/docs/next/page.mdx && grep -q 'chillClaimed' apps/docs/src/app/docs/react/page.mdx && pnpm build
