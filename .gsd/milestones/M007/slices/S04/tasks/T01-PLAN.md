---
estimated_steps: 10
estimated_files: 2
skills_used: []
---

# T01: Update node docs and home page for chillwhales fields + collection attributes

Update `apps/docs/src/app/docs/node/page.mdx` with all new S01–S03 content: fetchCollectionAttributes in fetch functions table, new Collection Attributes section (similar to existing Batch Encrypted Asset Fetch section), collectionAttributeKeys in key factories section, NFT include fields (score, rank, chillClaimed, orbsClaimed, level, cooldownExpiry, faction), NftFilter fields (chillClaimed, orbsClaimed, maxLevel, cooldownExpiryBefore), NftSortField score. Also add Collection Attributes row to home page Supported Domains table.

Steps:
1. Read `apps/docs/src/app/docs/node/page.mdx` and identify insertion points for each addition.
2. Add `Collection Attributes` row to the fetch functions table: `—` for Single, `fetchCollectionAttributes` for List.
3. Add a new `## Collection Attributes` section after the Batch Encrypted Asset Fetch section. Model it on the Batch Encrypted Asset Fetch section structure — parameters table, usage code block, behavioral notes. Document `fetchCollectionAttributes(url, { collectionAddress })` returning `{ attributes: CollectionAttribute[], totalCount: number }`.
4. Add `collectionAttributeKeys` to the key factories section with example: `collectionAttributeKeys.list(collectionAddress)`.
5. Add a note about new NFT include fields somewhere visible — either in the Include Fields section or as a new subsection. List all 7: score, rank, chillClaimed, orbsClaimed, level, cooldownExpiry, faction. Show a brief usage example with `fetchNfts` using `include: { score: true, rank: true }`.
6. Document new NftFilter fields (chillClaimed, orbsClaimed, maxLevel, cooldownExpiryBefore) and NftSortField `score` — add a brief paragraph or example near the Include Fields section or in the Collection Attributes section footer.
7. Read `apps/docs/src/app/(home)/page.mdx` and add a `Collection Attributes` row to the Supported Domains table with columns: `—`, `✓`, `—`, `—`.
8. Verify both files are valid MDX by checking no syntax errors are introduced.

## Inputs

- ``apps/docs/src/app/docs/node/page.mdx` — existing node docs page to update`
- ``apps/docs/src/app/(home)/page.mdx` — existing home page with Supported Domains table`
- ``packages/types/src/nfts.ts` — reference for NftInclude, NftFilter, NftSortField fields`
- ``packages/types/src/collection-attributes.ts` — reference for CollectionAttribute schema`
- ``packages/node/src/services/collection-attributes.ts` — reference for fetchCollectionAttributes API`
- ``packages/node/src/keys/collection-attributes.ts` — reference for collectionAttributeKeys`

## Expected Output

- ``apps/docs/src/app/docs/node/page.mdx` — updated with Collection Attributes section, NFT fields, filters, sort`
- ``apps/docs/src/app/(home)/page.mdx` — updated with Collection Attributes row in Supported Domains table`

## Verification

grep -q 'fetchCollectionAttributes' apps/docs/src/app/docs/node/page.mdx && grep -q 'collectionAttributeKeys' apps/docs/src/app/docs/node/page.mdx && grep -q 'Collection Attributes' apps/docs/src/app/\(home\)/page.mdx && grep -q 'chillClaimed' apps/docs/src/app/docs/node/page.mdx && grep -q 'NftSortField' apps/docs/src/app/docs/node/page.mdx
