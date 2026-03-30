# S01: NFT type + include extensions — UAT

**Milestone:** M007
**Written:** 2026-03-30T11:03:18.658Z

# S01 UAT: NFT type + include extensions

## Preconditions
- All packages built successfully via `pnpm build` (exit 0)
- Hasura schema has corresponding chillwhales NFT relations (score, rank, chillClaimed, orbsClaimed, level, cooldownExpiry, faction on nft table; score, rarity on lsp4_metadata_attribute)

---

## TC-01: NftSchema accepts chillwhales fields

**Steps:**
1. Import `NftSchema` from `@lsp-indexer/types`
2. Parse an object with `score: 42, rank: 100, chillClaimed: true, orbsClaimed: false, level: 5, cooldownExpiry: 1700000000, faction: "fire"` plus required base NFT fields
3. Verify parse succeeds and all 7 fields are present with correct values

**Expected:** All 7 fields parsed as provided types (number/boolean/string).

**Edge case:** Parse with all 7 fields as `null` — should succeed (all nullable).

---

## TC-02: NftIncludeSchema opt-in flags

**Steps:**
1. Import `NftIncludeSchema` from `@lsp-indexer/types`
2. Parse `{ score: true, rank: true, chillClaimed: false }` — should succeed
3. Parse `{}` — should succeed (all optional)
4. Parse `{ score: "yes" }` — should fail (not boolean)

**Expected:** Boolean opt-in flags accepted when present, omitted when absent.

---

## TC-03: NftSortField includes score

**Steps:**
1. Import `NftSortFieldSchema` from `@lsp-indexer/types`
2. Parse `'score'` — should succeed
3. Confirm existing sort fields (e.g., `'address'`, `'tokenId'`) still parse

**Expected:** `'score'` is a valid sort field alongside existing fields.

---

## TC-04: Lsp4Attribute includes score and rarity

**Steps:**
1. Import `Lsp4AttributeSchema` from `@lsp-indexer/types`
2. Parse an attribute object with `score: 88, rarity: 0.05` plus existing fields
3. Parse with `score: null, rarity: null`

**Expected:** Both score and rarity accepted as nullable numbers.

---

## TC-05: NFT GraphQL documents have @include variables

**Steps:**
1. Open `packages/node/src/documents/nfts.ts`
2. For each document (GetNft, GetNfts, NftSubscription), verify:
   - 7 variable declarations: `$includeScore: Boolean! = true` through `$includeFaction: Boolean! = true`
   - `score @include(if: $includeScore) { value }` inside both `lsp4Metadata` and `lsp4MetadataBaseUri`
   - `rank @include(if: $includeRank) { value }` inside both metadata blocks
   - `score` and `rarity` inside `attributes` sub-selection in both metadata blocks
   - 5 direct relations at NFT level: `chillClaimed`, `orbsClaimed`, `level`, `cooldownExpiry`, `faction`

**Expected:** All 3 documents structurally identical in their new field selections.

---

## TC-06: Owned-token documents propagate NFT fields

**Steps:**
1. Open `packages/node/src/documents/owned-tokens.ts`
2. For each document (GetOwnedToken, GetOwnedTokens, OwnedTokenSubscription), verify:
   - 7 variables with `$includeNft*` prefix
   - Same score/rank/attributes/direct-relation structure inside the `nft @include(if: $includeNft)` block

**Expected:** Owned-token NFT sub-selection mirrors NFT document structure with `includeNft` prefix.

---

## TC-07: parseNft extracts all 7 fields

**Steps:**
1. Call `parseNft` with a raw GraphQL response containing:
   - `lsp4Metadata.score.value = 42`, `lsp4Metadata.rank.value = 5`
   - `chillClaimed.value = true`, `orbsClaimed.value = false`, `level.value = 3`, `cooldownExpiry.value = 1700000000`, `faction.value = "water"`
2. Verify returned NFT object has all 7 fields with correct values

**Edge case:** Call with all metadata/relation fields absent — all 7 should be `null`.

**Edge case:** Call with `lsp4Metadata` absent but `lsp4MetadataBaseUri.score.value = 10` — score should fallback to 10.

---

## TC-08: parseAttributes includes score and rarity

**Steps:**
1. Call `parseAttributes` with a raw attributes array where entries include `score: 88, rarity: 0.05`
2. Verify returned attribute objects have score and rarity fields

**Expected:** score/rarity present in parsed output.

---

## TC-09: buildNftOrderBy handles score sort

**Steps:**
1. Call `buildNftOrderBy({ field: 'score', direction: 'desc' })`
2. Verify result is `[{ lsp4Metadata: { score: { value: 'desc_nulls_last' } } }, ...]` (or equivalent with block order)

**Expected:** Score sort uses nested `lsp4Metadata.score.value` path.

---

## TC-10: Full build verification

**Steps:**
1. Run `pnpm build`
2. Confirm exit code 0
3. Confirm all 9 workspace projects build (types, node, react, next, docs, abi, typeorm, indexer, comparison-tool)
4. Confirm docs generates 22 static pages

**Expected:** Zero errors across entire monorepo.
