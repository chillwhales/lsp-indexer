# S03: Collection attributes vertical — UAT

**Milestone:** M007
**Written:** 2026-03-30T11:24:15.536Z

# S03 UAT: Collection Attributes Vertical

## Preconditions
- All packages built clean (`pnpm build` exit 0)
- Hasura instance running with `lsp4_metadata_attribute` and `nft` tables populated
- Environment variables `NEXT_PUBLIC_LSP_INDEXER_URL` (client) and `LSP_INDEXER_URL` (server) configured

## Test Cases

### TC-01: fetchCollectionAttributes returns distinct attributes + totalCount
**Steps:**
1. Import `fetchCollectionAttributes` from `@lsp-indexer/node`
2. Call `fetchCollectionAttributes(url, { collectionAddress: '0x<known-collection>' })`
3. Verify response has `{ attributes: CollectionAttribute[], totalCount: number }`
4. Verify `attributes` contains objects with `{ key: string, value: string, type: string | null }`
5. Verify no duplicate `(key, value)` pairs exist in the result (distinct_on working)
6. Verify `totalCount` matches the number of NFTs in the collection

**Expected:** Response contains deduplicated attribute pairs and accurate NFT count.

### TC-02: fetchCollectionAttributes handles case-insensitive address matching
**Steps:**
1. Call with uppercase address: `fetchCollectionAttributes(url, { collectionAddress: '0xABCD...' })`
2. Call with lowercase address: `fetchCollectionAttributes(url, { collectionAddress: '0xabcd...' })`
3. Verify both return identical results (escapeLike + _ilike handles case)

**Expected:** Both calls return same attributes and totalCount.

### TC-03: fetchCollectionAttributes returns empty for unknown collection
**Steps:**
1. Call `fetchCollectionAttributes(url, { collectionAddress: '0x0000000000000000000000000000000000000000' })`
2. Verify response: `{ attributes: [], totalCount: 0 }`

**Expected:** Empty attributes array and zero totalCount.

### TC-04: React useCollectionAttributes hook
**Steps:**
1. Import `useCollectionAttributes` from `@lsp-indexer/react`
2. Render hook with `{ collectionAddress: '0x<known-collection>' }`
3. Verify initial state: `{ attributes: [], totalCount: 0, isLoading: true }`
4. Verify settled state: attributes populated, totalCount > 0, isLoading: false
5. Verify query key matches `['collection-attributes', 'list', collectionAddress]`

**Expected:** Hook returns loading → data transition with correct attributes.

### TC-05: React useCollectionAttributes hook disabled without address
**Steps:**
1. Render hook with `{ collectionAddress: '' }`
2. Verify query is not executed (enabled: false)
3. Verify `{ attributes: [], totalCount: 0, isLoading: false, fetchStatus: 'idle' }`

**Expected:** No network request when collectionAddress is empty.

### TC-06: Next.js getCollectionAttributes server action
**Steps:**
1. Import `getCollectionAttributes` from `@lsp-indexer/next/actions`
2. Call `getCollectionAttributes('0x<known-collection>')`
3. Verify returns `CollectionAttributesResult` with populated attributes

**Expected:** Server action returns same shape as direct fetchCollectionAttributes.

### TC-07: Next.js getCollectionAttributes validates input
**Steps:**
1. Call `getCollectionAttributes('')` (empty string)
2. Verify Zod validation error thrown by validateInput

**Expected:** Validation error for empty collectionAddress.

### TC-08: Next.js useCollectionAttributes hook
**Steps:**
1. Import `useCollectionAttributes` from `@lsp-indexer/next`
2. Render in a Next.js app context
3. Verify it routes through server action (not direct client fetch)
4. Verify returns same shape as React hook

**Expected:** Next.js hook delegates to server action and returns UseCollectionAttributesReturn.

### TC-09: Type exports available from all packages
**Steps:**
1. Verify `CollectionAttribute`, `CollectionAttributesResult`, `UseCollectionAttributesParams` importable from `@lsp-indexer/types`
2. Verify `fetchCollectionAttributes`, `collectionAttributeKeys`, `GetCollectionAttributesDocument` importable from `@lsp-indexer/node`
3. Verify `createUseCollectionAttributes`, `useCollectionAttributes`, `UseCollectionAttributesReturn` importable from `@lsp-indexer/react`
4. Verify `getCollectionAttributes` importable from `@lsp-indexer/next/actions`
5. Verify `useCollectionAttributes` importable from `@lsp-indexer/next`

**Expected:** All exports resolve without errors.

### TC-10: Address with special characters handled by escapeLike
**Steps:**
1. Call `fetchCollectionAttributes(url, { collectionAddress: '0x%test_addr' })`
2. Verify `%` and `_` are escaped (no SQL wildcard injection)

**Expected:** Query executes without matching unrelated rows due to wildcard characters.
