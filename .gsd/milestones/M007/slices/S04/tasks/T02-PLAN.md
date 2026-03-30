---
estimated_steps: 13
estimated_files: 2
skills_used: []
---

# T02: Update react + next docs and run final full-workspace build verification

Update `apps/docs/src/app/docs/react/page.mdx` and `apps/docs/src/app/docs/next/page.mdx` with all new S01–S03 content, then run `pnpm build` to verify the full 9-project workspace builds clean.

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

## Inputs

- ``apps/docs/src/app/docs/react/page.mdx` — existing react docs page to update`
- ``apps/docs/src/app/docs/next/page.mdx` — existing next docs page to update`
- ``apps/docs/src/app/docs/node/page.mdx` — T01 output, reference for consistent terminology`
- ``packages/types/src/nfts.ts` — reference for NftInclude, NftFilter, NftSortField fields`
- ``packages/types/src/collection-attributes.ts` — reference for CollectionAttribute schema`
- ``packages/react/src/hooks/collection-attributes/use-collection-attributes.ts` — reference for React hook API`
- ``packages/next/src/actions/collection-attributes.ts` — reference for server action API`
- ``packages/next/src/hooks/collection-attributes/use-collection-attributes.ts` — reference for Next.js hook API`

## Expected Output

- ``apps/docs/src/app/docs/react/page.mdx` — updated with Collection Attributes section, NFT fields, filters, sort`
- ``apps/docs/src/app/docs/next/page.mdx` — updated with Collection Attributes section, NFT fields, filters, sort`

## Verification

grep -q 'useCollectionAttributes' apps/docs/src/app/docs/react/page.mdx && grep -q 'getCollectionAttributes' apps/docs/src/app/docs/next/page.mdx && grep -q 'chillClaimed' apps/docs/src/app/docs/react/page.mdx && pnpm build
