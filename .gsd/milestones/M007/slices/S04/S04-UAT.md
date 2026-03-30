# S04: Docs + verification — UAT

**Milestone:** M007
**Written:** 2026-03-30T11:33:37.805Z

# S04 UAT: Docs + verification

## Preconditions
- Repository checked out at the S04 commit
- Node.js and pnpm available

## Test Cases

### TC1: Node docs — Collection Attributes content present
1. Open `apps/docs/src/app/docs/node/page.mdx`
2. Verify the fetch functions table contains a `Collection Attributes` row with `fetchCollectionAttributes` in the List column
3. Verify a `## Collection Attributes` section exists with:
   - Parameters table listing `url` (string, required) and `collectionAddress` (Hex, required)
   - TypeScript usage example calling `fetchCollectionAttributes`
   - Return shape showing `{ attributes: CollectionAttribute[], totalCount: number }`
   - Behavioral notes about distinct_on deduplication
4. Verify `collectionAttributeKeys.list(collectionAddress)` appears in the key factories section
5. **Expected:** All content present and correctly formatted

### TC2: Node docs — NFT include fields documented
1. In `apps/docs/src/app/docs/node/page.mdx`, find the NFT Include Fields subsection
2. Verify all 7 fields listed: score, rank, chillClaimed, orbsClaimed, level, cooldownExpiry, faction
3. Verify a code example shows `fetchNfts` with `include: { score: true, rank: true }`
4. **Expected:** All 7 fields documented with usage example

### TC3: Node docs — NFT filter and sort fields documented
1. In `apps/docs/src/app/docs/node/page.mdx`, find NftFilter and NftSortField subsections
2. Verify 4 filter fields: chillClaimed (boolean), orbsClaimed (boolean), maxLevel (number), cooldownExpiryBefore (number)
3. Verify NftSortField `score` documented
4. **Expected:** All filter/sort fields present with types

### TC4: Home page — Collection Attributes domain row
1. Open `apps/docs/src/app/(home)/page.mdx`
2. Find the Supported Domains table
3. Verify `Collection Attributes` row exists with correct capability columns
4. **Expected:** Row present in table

### TC5: React docs — Collection Attributes section
1. Open `apps/docs/src/app/docs/react/page.mdx`
2. Verify Available Domains table has `Collection Attributes` row with `useCollectionAttributes`
3. Verify `## Collection Attributes` section with hook usage example showing `collectionAddress` param and `{ attributes, totalCount, isLoading, error }` return shape
4. Verify NFT include fields, filter fields, and score sort field documented
5. **Expected:** All content present and consistent with node docs

### TC6: Next.js docs — Collection Attributes section
1. Open `apps/docs/src/app/docs/next/page.mdx`
2. Verify server actions table has `getCollectionAttributes` row
3. Verify `## Collection Attributes` section with both server action and hook usage examples
4. Verify NFT include/filter/sort fields documented consistently with react docs
5. **Expected:** All content present

### TC7: Full workspace build
1. Run `pnpm build`
2. Verify exit code 0
3. Verify all workspace projects compile (types, node, react, next, docs)
4. Verify static page generation completes (22/22 pages)
5. **Expected:** Clean build with no errors or warnings

### TC8: Cross-page consistency
1. Compare NFT include field lists across node, react, and next docs
2. Verify all 3 pages list the same 7 fields
3. Compare NftFilter field lists — same 4 fields on all pages
4. Compare NftSortField — score on all pages
5. **Expected:** Identical field lists across all docs pages
