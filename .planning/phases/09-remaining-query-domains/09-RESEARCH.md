# Phase 9 Research: Remaining Query Domains & Pagination

**Researched:** 2026-02-19
**Domain:** Hasura GraphQL schema — 10 remaining LSP indexer domains
**Confidence:** HIGH (all findings from `packages/node/schema.graphql` + `packages/node/src/graphql/graphql.ts` + existing Phase 8 reference code)

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Server actions scope:** Include bare server actions (`getX`, `getXs`) for all 10 domains in Phase 9, alongside services. Include `@lsp-indexer/next` hooks for all 10 domains. Mirror hook naming (`get` instead of `use`). Full `useInfinite*` parity in `@lsp-indexer/next`. No Zod input validation on actions — thin wrappers: `'use server'` + call service + return result.
- **Plan structure:** 12 plans total: 1 setup + 10 domain + 1 final integration.
- **Setup plan:** Run `pnpm schema:dump` + codegen once upfront, commit generated types. All domain plans start from this consistent generated state.
- **10 domain plans:** One per domain, fully independent — designed for parallel execution. Each self-contained: types → documents → parsers → services → keys → hooks (react + next) → actions → playground page.
- **Final integration plan:** Validates combined build, catches export conflicts, adds test app index/nav page, runs full build validation.
- **Infinite scroll coverage:** ALL list domains get `useInfinite*` hooks including event domains. `useProfileStats` and `useFollowCount` do NOT (scalars, not lists). Default page size: 20.
- **Playground depth:** Full-featured for all 10 domains — filter fields, sort controls, paginated results, client/server mode toggle, raw JSON toggle.

### Claude's Discretion

- Domain card component design for each new domain (structure, which fields to display)
- Exact filter field configs and sort options per domain
- Grouping logic for the test app index page
- Error state and loading skeleton implementation within shared component patterns

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

## Executive Summary

All 10 domains have been fully researched from the live GraphQL schema and codegen output. The schema confirms exact field names and relations for every table. Key findings:

1. **`follow` vs `follower` tables are BOTH present** — `follow` is the historical log (all follow events), `follower` is the current state (net follow relationships). The social domain should use `follower` for current state queries. However, `universal_profile.followedBy` and `universal_profile.followed` relations use `follow_bool_exp` (historical table), not `follower_bool_exp`. The top-level `follower` query uses `Follower_Bool_Exp`.

2. **`lsp4_token_type.value` is `String` (not `Int`)** — The schema declares `value: String` on `lsp4_token_type`. The numeric token type codes (0=token, 1=NFT, 2=NFT collection) are stored as strings in Hasura. Filter/comparison uses `String_Comparison_Exp`, not `Int_Comparison_Exp`.

3. **`useDigitalAssetSearch` is NOT a separate hook** — Confirmed: it should be a name/symbol filter parameter on `useDigitalAssets`. No separate search hook needed.

4. **`lsp4_metadata.name` is an object relation** (type `lsp4_metadata_name` with `value: String`) — distinct from `lsp4TokenName` on `digital_asset` (type `lsp4_token_name`). Both are object relations with `.value`.

5. **Nav already has placeholder routes** — `apps/test/src/components/nav.tsx` already defines all 9 routes (`/assets`, `/nfts`, `/owned`, `/follows`, `/creators`, `/encrypted`, `/events`, `/stats`) as `available: false`. The integration plan just needs to set them to `available: true` and add a `/feed` entry for the encrypted asset feed domain.

6. **`universal_receiver` has a `value` field** (numeric) not mentioned in the original domain spec — this represents LYX value transferred in the notification.

7. **`ProfileStats` query uses `followedBy_aggregate` and `followed_aggregate` on `universal_profile`** — both use `follow_aggregate` (not `follower_aggregate`). The `universal_profile` type does NOT expose `follower`/`follower_aggregate` relations — only `followedBy`/`followed` which are backed by the `follow` table.

**Primary recommendation:** Replicate the profiles vertical-slice pattern exactly for all 10 domains. The patterns are fully proven; domain-specific variations are minor (filter field names, sort options, aggregate structure for stats).

---

## Per-Domain Analysis

---

### Domain 1: Digital Assets

**Hasura table:** `digital_asset`
**Query entry points:** `digital_asset(where, order_by, limit, offset)`, `digital_asset_aggregate(where)`
**Codegen types:** `Digital_Asset_Bool_Exp`, `Digital_Asset_Order_By`

**Exact schema fields (from schema.graphql lines 1273–1600):**

```
digital_asset {
  address: String!
  id: String!
  lsp4Metadata: lsp4_metadata       ← object relation (token metadata)
  lsp4TokenName: lsp4_token_name    ← object relation { value: String, raw_value: String }
  lsp4TokenSymbol: lsp4_token_symbol ← object relation { value: String, raw_value: String }
  lsp4TokenType: lsp4_token_type    ← object relation { value: String }  ← NOTE: String not Int!
  lsp4CreatorsLength: lsp4_creators_length ← object relation
  lsp4Creators([args]): [lsp4_creator!]!  ← array relation
  lsp8TokenIdFormat: lsp8_token_id_format ← object relation
  lsp8ReferenceContract: lsp8_reference_contract ← object relation
  lsp8TokenMetadataBaseUri: lsp8_token_metadata_base_uri ← object relation
  decimals: decimals                 ← object relation { value: Int! }
  nfts([args]): [nft!]!              ← array relation
  ownedAssets([args]): [owned_asset!]! ← array relation
  dataChanged([args]): [data_changed!]! ← array relation
}
```

**`lsp4_metadata` sub-structure (object relation on digital_asset, lines 8436–8652):**

```
lsp4_metadata {
  address: String!
  id: String!
  is_data_fetched: Boolean!
  raw_value: String!
  url: String
  token_id: String          ← for NFT-specific metadata
  name: lsp4_metadata_name  ← object relation { value: String }
  description: lsp4_metadata_description ← object relation { value: String }
  category: lsp4_metadata_category ← object relation { value: String }
  images([args]): [lsp4_metadata_image!]!
  icon([args]): [lsp4_metadata_icon!]!
  links([args]): [lsp4_metadata_link!]!
  attributes([args]): [lsp4_metadata_attribute!]!
  assets([args]): [lsp4_metadata_asset!]!
}
lsp4_metadata_image { url, width, height, verification_data, verification_method, image_index }
lsp4_metadata_icon  { url, width, height, verification_data, verification_method }
lsp4_metadata_link  { title, url }
```

**Proposed TypeScript type shape:**

```typescript
export const DigitalAssetSchema = z.object({
  address: z.string(),
  tokenName: z.string().nullable(), // lsp4TokenName.value
  tokenSymbol: z.string().nullable(), // lsp4TokenSymbol.value
  tokenType: z.string().nullable(), // lsp4TokenType.value ("0", "1", "2")
  decimals: z.number().nullable(), // decimals.value
  metadataName: z.string().nullable(), // lsp4Metadata.name.value
  metadataDescription: z.string().nullable(), // lsp4Metadata.description.value
  metadataImages: z.array(
    z.object({
      url: z.string().nullable(),
      width: z.number().nullable(),
      height: z.number().nullable(),
    }),
  ),
  metadataIcons: z.array(
    z.object({
      url: z.string().nullable(),
      width: z.number().nullable(),
      height: z.number().nullable(),
    }),
  ),
});
```

**Filters:**

- `address` → `{ address: { _ilike: address } }` (partial match)
- `tokenName` → `{ lsp4TokenName: { value: { _ilike: '%name%' } } }`
- `tokenSymbol` → `{ lsp4TokenSymbol: { value: { _ilike: '%symbol%' } } }`
- `tokenType` → `{ lsp4TokenType: { value: { _eq: '0' } } }` (exact string match: "0", "1", "2")

**Sort fields:**

- `tokenName` → `{ lsp4TokenName: { value: 'asc_nulls_last' } }`
- `tokenSymbol` → `{ lsp4TokenSymbol: { value: 'asc_nulls_last' } }`
- `address` → `{ address: 'asc' }`

**Hooks:** `useDigitalAsset(address)`, `useDigitalAssets(params?)`, `useInfiniteDigitalAssets(params?)`

- NOTE: "useDigitalAssetSearch" in requirements = filter on `useDigitalAssets`, NOT a separate hook

**GraphQL document pattern:**

```graphql
query GetDigitalAsset($where: digital_asset_bool_exp!) {
  digital_asset(where: $where, limit: 1) {
    id
    address
    lsp4TokenName { value }
    lsp4TokenSymbol { value }
    lsp4TokenType { value }
    decimals { value }
    lsp4Metadata {
      name { value }
      description { value }
      images(limit: 5, order_by: { image_index: asc }) {
        url width height verification_data verification_method
      }
      icon(limit: 1) { url width height }
    }
  }
}

query GetDigitalAssets(
  $where: digital_asset_bool_exp
  $order_by: [digital_asset_order_by!]
  $limit: Int
  $offset: Int
) {
  digital_asset(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
    # same fields
  }
  digital_asset_aggregate(where: $where) {
    aggregate { count }
  }
}
```

**@include directives:** Not needed — all fields are reasonably lightweight. The profile pattern uses @include because lsp3Profile images are heavy. Digital assets don't need it for the basic shape.

**Domain-specific pitfalls:**

- `lsp4TokenType.value` is a **String**, not Int. Token type "0" = Token/LSP7, "1" = NFT/LSP8, "2" = NFT Collection. Filter with `_eq`, not numeric comparison.
- `lsp4Metadata` is nullable — the asset may exist but metadata may not be fetched yet (`is_data_fetched: false`).
- `lsp4Metadata.name` ≠ `lsp4TokenName`. The former is from the off-chain metadata JSON; the latter is from the on-chain `LSP4TokenName` data key. Both can be null.
- Do NOT include game-specific relations (`nfts` array, `ownedAssets` array) in the basic digital asset document — these cause N+1 and are domain-specific.
- `decimals.value` is `Int!` (not nullable in type, but the relation itself is nullable).

---

### Domain 2: NFTs

**Hasura table:** `nft`
**Query entry points:** `nft(where, order_by, limit, offset)`, `nft_aggregate(where)`
**Codegen types:** `Nft_Bool_Exp`, `Nft_Order_By`

**Exact schema fields (lines 13086–13195):**

```
nft {
  address: String!          ← NFT collection contract address
  id: String!               ← composite: address + tokenId (Hasura internal ID)
  token_id: String!         ← the actual token ID
  formatted_token_id: String ← human-readable format
  is_burned: Boolean!
  is_minted: Boolean!
  digital_asset_id: String
  lsp4_metadata_id: String
  lsp4_metadata_base_uri_id: String
  digitalAsset: digital_asset ← object relation (the collection)
  lsp4Metadata: lsp4_metadata ← object relation (token-specific metadata)
  lsp4MetadataBaseUri: lsp4_metadata ← object relation (base URI metadata)
  ownedToken: owned_token    ← object relation (current owner)
  tokenIdDataChanged([args]): [token_id_data_changed!]! ← array
  transfer([args]): [transfer!]! ← array
  # Game-specific (IGNORE): chillClaimed, orbsClaimed, level, faction, cooldownExpiry
}
```

**Proposed TypeScript type shape:**

```typescript
export const NftSchema = z.object({
  address: z.string(), // collection contract address
  tokenId: z.string(), // raw token ID
  formattedTokenId: z.string().nullable(),
  isBurned: z.boolean(),
  isMinted: z.boolean(),
  owner: z.string().nullable(), // ownedToken?.owner
  metadataName: z.string().nullable(), // lsp4Metadata?.name?.value
  metadataDescription: z.string().nullable(),
  metadataImages: z.array(
    z.object({
      url: z.string().nullable(),
      width: z.number().nullable(),
      height: z.number().nullable(),
    }),
  ),
});
```

**Filters:**

- `address` (collection) → `{ address: { _ilike: address } }`
- `tokenId` → `{ token_id: { _ilike: tokenId } }`
- `owner` → `{ ownedToken: { owner: { _ilike: owner } } }`
- `isBurned` → `{ is_burned: { _eq: false } }` (default: exclude burned)
- `isMinted` → `{ is_minted: { _eq: true } }`

**Sort fields:**

- `tokenId` → `{ token_id: 'asc' }`
- `formattedTokenId` → `{ formatted_token_id: 'asc_nulls_last' }`
- `address` → `{ address: 'asc' }`

**Hooks:**

- `useNft({ address, tokenId })` — single NFT fetch
- `useNfts(params?)` — paginated list with filters
- `useNftsByCollection({ collectionAddress, filter?, sort? })` — convenience wrapper (filter on useNfts)
- `useInfiniteNfts(params?)` — infinite scroll

**NOTE on useNftsByCollection:** This is a filter variant, not a separate Hasura query. Implement as a convenience hook that calls `useInfiniteNfts` (or `useNfts`) with `filter.address = collectionAddress`.

**GraphQL document pattern:**

```graphql
query GetNft($where: nft_bool_exp!) {
  nft(where: $where, limit: 1) {
    id
    address
    token_id
    formatted_token_id
    is_burned
    is_minted
    ownedToken { owner }
    lsp4Metadata {
      name { value }
      description { value }
      images(limit: 5, order_by: { image_index: asc }) {
        url width height
      }
    }
  }
}

query GetNfts(
  $where: nft_bool_exp
  $order_by: [nft_order_by!]
  $limit: Int
  $offset: Int
) {
  nft(where: $where, order_by: $order_by, limit: $limit, offset: $offset) { ... }
  nft_aggregate(where: $where) { aggregate { count } }
}
```

**Domain-specific pitfalls:**

- NFT `id` in Hasura is the composite address+tokenId internal key — NOT useful for API users. Use `address` + `token_id` for identification.
- For `useNft({ address, tokenId })`, the where clause is: `{ address: { _ilike: address }, token_id: { _ilike: tokenId } }`
- `lsp4MetadataBaseUri` is a separate metadata object for LSP8 base URI pattern — only relevant for advanced NFT collections. Skip in basic type shape.
- Game-specific fields (`chillClaimed`, `orbsClaimed`, `level`, `faction`, `cooldownExpiry`) are in the Hasura schema but should be IGNORED — they're specific to CHILLWHALES/ORBs NFT collections.
- `ownedToken` is nullable (a burned or not-yet-minted NFT has no current owner).

---

### Domain 3: Owned Assets

**Hasura tables:** `owned_asset` (LSP7 fungible token balances), `owned_token` (LSP8 NFT ownership records)
**Query entry points:** `owned_asset(where, order_by, limit, offset)`, `owned_asset_aggregate(where)`, `owned_token(where, order_by, limit, offset)`, `owned_token_aggregate(where)`
**Codegen types:** `Owned_Asset_Bool_Exp`, `Owned_Asset_Order_By`, `Owned_Token_Bool_Exp` (check via `Owned_Token_Order_By`)

**Exact schema fields:**

```
owned_asset (lines 14078–14129) {
  address: String!       ← token contract address (LSP7)
  id: String!
  owner: String!         ← UP address of owner
  balance: numeric!      ← token balance (can be very large, use string in TS)
  block: Int!
  timestamp: timestamptz!
  digital_asset_id: String
  digitalAsset: digital_asset  ← object relation
  tokenIds([args]): [owned_token!]! ← NFT IDs held in this LSP8 position
  universalProfile: universal_profile ← owner's profile
  universal_profile_id: String
}

owned_token (lines 14439–14462) {
  address: String!       ← NFT contract address (LSP8)
  id: String!
  owner: String!         ← UP address of owner
  token_id: String!
  block: Int!
  timestamp: timestamptz!
  digital_asset_id: String
  nft_id: String
  owned_asset_id: String
  digitalAsset: digital_asset ← object relation (the collection)
  nft: nft               ← object relation (the specific token)
  ownedAsset: owned_asset ← parent owned_asset record
  universalProfile: universal_profile ← owner's profile
  universal_profile_id: String
}
```

**Proposed TypeScript type shapes:**

```typescript
export const OwnedAssetSchema = z.object({
  address: z.string(), // token contract address
  owner: z.string(), // UP address of owner
  balance: z.string(), // numeric as string (large numbers)
  block: z.number(),
  timestamp: z.string(), // ISO timestamptz
  tokenName: z.string().nullable(), // digitalAsset.lsp4TokenName.value
  tokenSymbol: z.string().nullable(), // digitalAsset.lsp4TokenSymbol.value
  tokenType: z.string().nullable(), // digitalAsset.lsp4TokenType.value
});

export const OwnedTokenSchema = z.object({
  address: z.string(), // NFT contract address
  owner: z.string(), // UP address of owner
  tokenId: z.string(),
  block: z.number(),
  timestamp: z.string(),
  tokenName: z.string().nullable(), // digitalAsset.lsp4TokenName.value
  formattedTokenId: z.string().nullable(), // nft.formatted_token_id
  metadataName: z.string().nullable(), // nft.lsp4Metadata.name.value
});
```

**Filters:**

- OwnedAssets: `ownerAddress` → `{ owner: { _ilike: owner } }`, `assetAddress` → `{ address: { _ilike: address } }`
- OwnedTokens: `ownerAddress` → `{ owner: { _ilike: owner } }`, `collectionAddress` → `{ address: { _ilike: address } }`

**Sort fields:**

- OwnedAssets: `timestamp` → `{ timestamp: 'desc' }`, `balance` → `{ balance: 'desc' }`
- OwnedTokens: `timestamp` → `{ timestamp: 'desc' }`, `tokenId` → `{ token_id: 'asc' }`

**Hooks:**

- `useOwnedAssets({ ownerAddress, filter?, sort?, limit?, offset? })`
- `useOwnedTokens({ ownerAddress, filter?, sort?, limit?, offset? })`
- `useInfiniteOwnedAssets(params?)`
- `useInfiniteOwnedTokens(params?)`

**NOTE:** `ownerAddress` is a REQUIRED filter for both hooks (not optional). Hooks should be disabled when `ownerAddress` is empty.

**GraphQL document pattern:**

```graphql
query GetOwnedAssets($where: owned_asset_bool_exp, $order_by: [owned_asset_order_by!], $limit: Int, $offset: Int) {
  owned_asset(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
    id
    address
    owner
    balance
    block
    timestamp
    digitalAsset {
      lsp4TokenName { value }
      lsp4TokenSymbol { value }
      lsp4TokenType { value }
    }
  }
  owned_asset_aggregate(where: $where) { aggregate { count } }
}

query GetOwnedTokens($where: owned_token_bool_exp, ...) {
  owned_token(where: $where, ...) {
    id
    address
    owner
    token_id
    block
    timestamp
    digitalAsset { lsp4TokenName { value } }
    nft { formatted_token_id lsp4Metadata { name { value } } }
  }
  owned_token_aggregate(where: $where) { aggregate { count } }
}
```

**Domain-specific pitfalls:**

- `balance` is Hasura `numeric` — will come back as a string in JSON (large integers exceed JS number precision). Always handle as string in TypeScript type.
- `ownerAddress` is always a required param for practical queries — querying all owned assets without an owner is not useful. Use `enabled: Boolean(params.ownerAddress)` in hooks.
- `owned_asset.tokenIds` is the array of `owned_token` records for an LSP8 position. This creates a two-level hierarchy: one `owned_asset` can have many `owned_token` records. In the playground, show them separately.

---

### Domain 4: Social / Follows

**Hasura table:** `follower` (current follow state — use this, NOT `follow`)
**Query entry points:** `follower(where, order_by, limit, offset)`, `follower_aggregate(where)`
**Codegen types:** `Follower_Bool_Exp`, `Follower_Order_By`

**CRITICAL DISTINCTION:** Two tables exist:

- `follow` — historical log (each follow event, including now-unfollowed relationships)
- `follower` — current state (net active follows only)
- Use `follower` for `useFollowers`/`useFollowing` (current relationships)
- `universal_profile.followedBy` and `universal_profile.followed` use the `follow` table (for profile stats context)
- For standalone follower queries, use the top-level `follower` table

**Exact schema fields (lines 2793–2810):**

```
follower {
  address: String!                        ← this field equals followed_address (not UP address)
  id: String!
  follower_address: String!               ← address of who IS following
  followed_address: String!               ← address of who IS being followed
  follower_universal_profile_id: String
  followed_universal_profile_id: String
  block_number: Int!
  log_index: Int!
  transaction_index: Int!
  timestamp: timestamptz!
  followerUniversalProfile: universal_profile  ← the follower's profile
  followedUniversalProfile: universal_profile  ← the followed profile
}
```

**Proposed TypeScript type shapes:**

```typescript
export const FollowSchema = z.object({
  followerAddress: z.string(), // follower_address
  followedAddress: z.string(), // followed_address
  blockNumber: z.number(),
  timestamp: z.string(),
  // Optional profile info
  followerName: z.string().nullable(), // followerUniversalProfile.lsp3Profile.name.value
  followedName: z.string().nullable(), // followedUniversalProfile.lsp3Profile.name.value
});

export const FollowCountSchema = z.object({
  followerCount: z.number(), // count where followed_address = address
  followingCount: z.number(), // count where follower_address = address
});
```

**Filters:**

- `useFollowers(address)` → `{ followed_address: { _ilike: address } }` (people following `address`)
- `useFollowing(address)` → `{ follower_address: { _ilike: address } }` (people `address` follows)

**Sort fields:**

- `timestamp` → `{ timestamp: 'desc' }` (most recent follows first)
- `blockNumber` → `{ block_number: 'desc' }`

**Hooks:**

- `useFollowers({ address, filter?, sort?, limit?, offset? })` — list of follower records
- `useFollowing({ address, filter?, sort?, limit?, offset? })` — list of following records
- `useFollowCount({ address })` — scalar aggregate, NO infinite variant
- `useInfiniteFollowers(params?)` — infinite scroll
- `useInfiniteFollowing(params?)` — infinite scroll

**NOTE on `useFollowCount`:** Uses `follower_aggregate { aggregate { count } }` with two separate calls OR a single query with `follower_aggregate` filtered by both `followed_address` and `follower_address`.

**Recommended `useFollowCount` approach** — single query fetching both aggregates:

```graphql
query GetFollowCount($followedWhere: follower_bool_exp!, $followerWhere: follower_bool_exp!) {
  followerCount: follower_aggregate(where: $followedWhere) {
    aggregate {
      count
    }
  }
  followingCount: follower_aggregate(where: $followerWhere) {
    aggregate {
      count
    }
  }
}
```

Where `$followedWhere = { followed_address: { _ilike: address } }` and `$followerWhere = { follower_address: { _ilike: address } }`.

**Domain-specific pitfalls:**

- `follower.address` in the schema equals `followed_address` (confusingly named). Use `follower_address` and `followed_address` fields directly.
- `universal_profile.followedBy` and `universal_profile.followed` are backed by the `follow` table, NOT the `follower` table. For profile stats counts, Phase 8 already uses these via `followedBy_aggregate` and `followed_aggregate` which count `follow` records (fine — it's equivalent for current follows since `follow` tracks follow events and the `follower` table is a view of current state).

---

### Domain 5: Creator Addresses

**Hasura table:** `lsp4_creator`
**Query entry points:** `lsp4_creator(where, order_by, limit, offset)`, `lsp4_creator_aggregate(where)`
**Codegen types:** `Lsp4_Creator_Bool_Exp`, `Lsp4_Creator_Order_By`

**Exact schema fields (lines 7959–7974):**

```
lsp4_creator {
  address: String!          ← digital asset contract address
  id: String!
  creator_address: String!  ← UP address of the creator
  array_index: numeric      ← position in the creators array
  timestamp: timestamptz!
  digital_asset_id: String
  creator_profile_id: String
  interface_id: String      ← interface ID of the creator
  digitalAsset: digital_asset    ← object relation
  creatorProfile: universal_profile ← creator's UP profile
}
```

**Proposed TypeScript type shape:**

```typescript
export const CreatorSchema = z.object({
  assetAddress: z.string(), // address (digital asset contract)
  creatorAddress: z.string(), // creator_address (UP address)
  arrayIndex: z.number().nullable(), // array_index
  interfaceId: z.string().nullable(),
  timestamp: z.string(),
  // Optional creator profile info
  creatorName: z.string().nullable(), // creatorProfile.lsp3Profile.name.value
});
```

**Filters:**

- Primary: `assetAddress` → `{ address: { _ilike: assetAddress } }`
- Secondary: `creatorAddress` → `{ creator_address: { _ilike: creatorAddress } }`

**Sort fields:**

- `arrayIndex` → `{ array_index: 'asc' }` (default — preserves creator order)
- `timestamp` → `{ timestamp: 'desc' }`

**Hooks:**

- `useCreators({ assetAddress, sort? })` — creators for a specific asset (required param)
- `useInfiniteCreators(params?)` — useful if an asset has many creators
- No `useCreator(id)` — not needed; always query by asset

**NOTE:** The hook name should be `useCreators` (not `useCreatorAddresses` as in original spec — "creator" is more natural). Or follow the exact spec naming if required.

**GraphQL document pattern:**

```graphql
query GetCreators(
  $where: lsp4_creator_bool_exp
  $order_by: [lsp4_creator_order_by!]
  $limit: Int
  $offset: Int
) {
  lsp4_creator(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
    id
    address
    creator_address
    array_index
    interface_id
    timestamp
    creatorProfile {
      address
      lsp3Profile {
        name {
          value
        }
      }
    }
  }
  lsp4_creator_aggregate(where: $where) {
    aggregate {
      count
    }
  }
}
```

**Domain-specific pitfalls:**

- `assetAddress` is almost always required. Without it, you'd get all creators across all assets (not useful).
- `array_index` is `numeric` (Hasura) which is a string in codegen — sort by it as-is but parse to number in TypeScript.
- `interface_id` may indicate whether creator is a smart contract (ERC725Y interface) or EOA.

---

### Domain 6: Encrypted Assets (LSP29)

**Hasura table:** `lsp29_encrypted_asset`
**Query entry points:** `lsp29_encrypted_asset(where, order_by, limit, offset)`, `lsp29_encrypted_asset_aggregate(where)`
**Codegen types:** `Lsp29_Encrypted_Asset_Bool_Exp`, `Lsp29_Encrypted_Asset_Order_By`

**Exact schema fields (lines 3884–3956):**

```
lsp29_encrypted_asset {
  address: String!              ← UP address that published this asset
  id: String!
  content_id: String            ← unique content identifier
  url: String                   ← URL to the encrypted file
  version: String               ← version string
  revision: Int                 ← revision number
  array_index: numeric          ← position in UP's encrypted assets array
  raw_value: String!
  is_data_fetched: Boolean!
  created_at: timestamptz
  timestamp: timestamptz!
  universal_profile_id: String
  decode_error: String
  fetch_error_code: String
  fetch_error_message: String
  fetch_error_status: Int
  retry_count: Int
  title: lsp29_encrypted_asset_title         ← object { value: String }
  description: lsp29_encrypted_asset_description ← object { value: String }
  file: lsp29_encrypted_asset_file           ← object { name, type, size, hash, last_modified }
  encryption: lsp29_encrypted_asset_encryption ← object { method, ciphertext, ... + accessControlConditions[] }
  chunks: lsp29_encrypted_asset_chunks       ← object { cids, iv, total_size }
  images([args]): [lsp29_encrypted_asset_image!]! ← array { url, width, height, verification_* }
  universalProfile: universal_profile
}
```

**`lsp29_encrypted_asset_file` sub-structure:**

```
lsp29_encrypted_asset_file { hash, name, size, type, last_modified }
```

**`lsp29_encrypted_asset_encryption` sub-structure:**

```
lsp29_encrypted_asset_encryption {
  method, ciphertext, data_to_encrypt_hash, decryption_code, decryption_params
  accessControlConditions([args]): [lsp29_access_control_condition!]!
}
```

**Proposed TypeScript type shape:**

```typescript
export const EncryptedAssetSchema = z.object({
  address: z.string(), // UP that published
  contentId: z.string().nullable(),
  url: z.string().nullable(),
  version: z.string().nullable(),
  revision: z.number().nullable(),
  arrayIndex: z.number().nullable(),
  isDataFetched: z.boolean(),
  createdAt: z.string().nullable(),
  timestamp: z.string(),
  title: z.string().nullable(), // title.value
  description: z.string().nullable(), // description.value
  file: z
    .object({
      name: z.string().nullable(),
      type: z.string().nullable(),
      size: z.string().nullable(), // numeric as string
      hash: z.string().nullable(),
    })
    .nullable(),
  encryptionMethod: z.string().nullable(), // encryption.method
  images: z.array(
    z.object({
      url: z.string().nullable(),
      width: z.number().nullable(),
      height: z.number().nullable(),
    }),
  ),
});
```

**Filters:**

- `ownerAddress` → `{ address: { _ilike: ownerAddress } }` (UP that published)
- `contentId` → `{ content_id: { _ilike: contentId } }`
- `isDataFetched` → `{ is_data_fetched: { _eq: true } }`

**Sort fields:**

- `timestamp` → `{ timestamp: 'desc' }` (newest first)
- `arrayIndex` → `{ array_index: 'asc' }` (preserve publication order)
- `revision` → `{ revision: 'desc' }`

**Hooks:**

- `useEncryptedAsset({ address, contentId })` — single asset fetch
- `useEncryptedAssets({ ownerAddress?, filter?, sort?, limit?, offset? })` — list
- `useInfiniteEncryptedAssets(params?)` — infinite scroll

**Domain-specific pitfalls:**

- `address` on `lsp29_encrypted_asset` is the **publisher's UP address** (not an asset contract address). A UP can publish many encrypted assets.
- `encryption.accessControlConditions` is a complex array — omit from the basic type, expose only `encryption.method`.
- `chunks.cids` is a `[String!]` array — IPFS chunk CIDs for large files split into chunks.
- `file.size` is `numeric` — comes back as string; treat as string in TypeScript.
- `is_data_fetched: false` means the indexer couldn't fetch the metadata yet — filter these out in playground by default.

---

### Domain 7: Encrypted Asset Feed (LSP29 Entries)

**Hasura table:** `lsp29_encrypted_asset_entry`
**Query entry points:** `lsp29_encrypted_asset_entry(where, order_by, limit, offset)`, `lsp29_encrypted_asset_entry_aggregate(where)`
**Codegen type:** `Lsp29_Encrypted_Asset_Entry_Order_By`

**Exact schema fields (lines 4516–4526):**

```
lsp29_encrypted_asset_entry {
  address: String!          ← UP address that has this in their feed
  id: String!
  content_id_hash: String!  ← hash of the content ID (not the content ID itself)
  array_index: numeric      ← position in the feed
  timestamp: timestamptz!
  universal_profile_id: String
  universalProfile: universal_profile ← relation to UP
}
```

**Proposed TypeScript type shape:**

```typescript
export const EncryptedAssetEntrySchema = z.object({
  address: z.string(), // UP address
  contentIdHash: z.string(), // content_id_hash
  arrayIndex: z.number().nullable(),
  timestamp: z.string(),
});
```

**Filters:**

- Primary: `ownerAddress` → `{ address: { _ilike: ownerAddress } }` (required — feed for a specific UP)

**Sort fields:**

- `arrayIndex` → `{ array_index: 'asc' }` (feed order)
- `timestamp` → `{ timestamp: 'desc' }`

**Hooks:**

- `useEncryptedAssetFeed({ address, filter?, sort?, limit?, offset? })` — entries for a UP
- `useInfiniteEncryptedAssetFeed(params?)` — infinite scroll

**Domain-specific pitfalls:**

- `content_id_hash` is the HASH of the content ID — to get the actual content, you'd need to query `lsp29_encrypted_asset` by matching. The entry table is a feed/index, not the content itself.
- This table is the LSP29 "asset feed" — the list of content IDs a UP has received/subscribed to.
- `address` is a required filter param in practice — querying all entries globally is not meaningful.
- There is NO direct relation from `lsp29_encrypted_asset_entry` to `lsp29_encrypted_asset`. They're linked by content_id_hash ↔ content_id relationship but no GraphQL join.

---

### Domain 8: Data Changed Events

**Hasura table:** `data_changed`
**Query entry points:** `data_changed(where, order_by, limit, offset)`, `data_changed_aggregate(where)`
**Codegen types:** `Data_Changed_Bool_Exp`, `Data_Changed_Order_By`

**Exact schema fields (lines 256–273):**

```
data_changed {
  address: String!          ← contract that emitted the DataChanged event
  id: String!
  data_key: String!         ← ERC725Y data key (hex string)
  data_value: String!       ← new value (hex string)
  block_number: Int!
  log_index: Int!
  transaction_index: Int!
  timestamp: timestamptz!
  digital_asset_id: String
  universal_profile_id: String
  digitalAsset: digital_asset      ← relation if address is a digital asset
  universalProfile: universal_profile ← relation if address is a UP
}
```

**Proposed TypeScript type shape:**

```typescript
export const DataChangedEventSchema = z.object({
  address: z.string(), // contract address
  dataKey: z.string(), // ERC725Y data key (hex)
  dataValue: z.string(), // new value (hex)
  blockNumber: z.number(),
  logIndex: z.number(),
  transactionIndex: z.number(),
  timestamp: z.string(),
});
```

**Filters:**

- `address` → `{ address: { _ilike: address } }` (contract address — required in practice)
- `dataKey` → `{ data_key: { _ilike: dataKey } }` (filter by specific data key)
- `blockNumberGte` → `{ block_number: { _gte: blockNumber } }`
- `blockNumberLte` → `{ block_number: { _lte: blockNumber } }`

**Sort fields:** Default is `block_number DESC` (newest events first)

- `blockNumber` → `{ block_number: 'desc' }` (DEFAULT)
- `timestamp` → `{ timestamp: 'desc' }`

**Hooks:**

- `useDataChangedEvents({ address?, filter?, sort?, limit?, offset? })` — event list
- `useInfiniteDataChangedEvents(params?)` — infinite scroll (newest first by default)

**GraphQL document pattern:**

```graphql
query GetDataChangedEvents(
  $where: data_changed_bool_exp
  $order_by: [data_changed_order_by!]
  $limit: Int
  $offset: Int
) {
  data_changed(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
    id
    address
    data_key
    data_value
    block_number
    log_index
    transaction_index
    timestamp
  }
  data_changed_aggregate(where: $where) {
    aggregate {
      count
    }
  }
}
```

**Domain-specific pitfalls:**

- Default sort MUST be `block_number DESC` for event domains — users want newest events first.
- `data_key` and `data_value` are hex strings (e.g., `0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5`). Don't try to decode them in the indexer layer — expose raw hex.
- Without an `address` filter, queries against all DataChanged events will be extremely large. The `address` filter should be strongly recommended (but not enforced).
- `data_value` is `String!` (not nullable) in schema — but can be `"0x"` (empty value).

---

### Domain 9: Universal Receiver Events

**Hasura table:** `universal_receiver`
**Query entry points:** `universal_receiver(where, order_by, limit, offset)`, `universal_receiver_aggregate(where)`
**Codegen types:** `Universal_Receiver_Bool_Exp`, `Universal_Receiver_Order_By`

**Exact schema fields (lines 25171–25195):**

```
universal_receiver {
  address: String!          ← contract that received the notification
  id: String!
  from: String!             ← sender address
  type_id: String!          ← notification type (LSP1 typeId, e.g., LSP7/LSP8 transfer typeIds)
  received_data: String!    ← data sent with the notification
  returned_value: String!   ← value returned by universalReceiver
  value: numeric!           ← LYX value (numeric → string in TS)
  block_number: Int!
  log_index: Int!
  transaction_index: Int!
  timestamp: timestamptz!
  from_asset_id: String
  from_profile_id: String
  universal_profile_id: String
  fromAsset: digital_asset        ← relation if 'from' is a digital asset
  fromProfile: universal_profile  ← relation if 'from' is a UP
  universalProfile: universal_profile ← the receiving profile
}
```

**Proposed TypeScript type shape:**

```typescript
export const UniversalReceiverEventSchema = z.object({
  address: z.string(), // receiving contract
  from: z.string(), // sender address
  typeId: z.string(), // LSP1 typeId (hex)
  receivedData: z.string(), // data sent
  returnedValue: z.string(),
  value: z.string(), // numeric as string
  blockNumber: z.number(),
  logIndex: z.number(),
  transactionIndex: z.number(),
  timestamp: z.string(),
});
```

**Filters:**

- `address` → `{ address: { _ilike: address } }` (receiver address)
- `from` → `{ from: { _ilike: from } }` (sender address)
- `typeId` → `{ type_id: { _ilike: typeId } }` (notification type)
- `blockNumberGte` / `blockNumberLte` — block range

**Sort fields:** Default is `block_number DESC`

- `blockNumber` → `{ block_number: 'desc' }` (DEFAULT)
- `timestamp` → `{ timestamp: 'desc' }`

**Hooks:**

- `useUniversalReceiverEvents({ address?, filter?, sort?, limit?, offset? })` — event list
- `useInfiniteUniversalReceiverEvents(params?)` — infinite scroll

**Domain-specific pitfalls:**

- `value` is `numeric!` (NOT nullable in schema) — Hasura `numeric` comes back as string in JSON. Always string in TypeScript type.
- `type_id` is a hex string identifying the type of LSP notification (e.g., token transfer received, follow received).
- `received_data` and `returned_value` are hex strings.
- Default sort MUST be `block_number DESC` — event domain.

---

### Domain 10: Profile Stats

**Hasura table:** `universal_profile` (aggregates on relations)
**Query entry point:** `universal_profile(where: { address: { _ilike: address } }, limit: 1)`
**This is NOT a list query — returns a single stats object for one profile address.**

**Required aggregations (from universal_profile relations):**

```
universal_profile {
  address: String!
  followedBy_aggregate { aggregate { count } }    ← followerCount (backed by 'follow' table)
  followed_aggregate { aggregate { count } }       ← followingCount (backed by 'follow' table)
  ownedAssets_aggregate { aggregate { count } }    ← ownedAssetsCount
  ownedTokens_aggregate { aggregate { count } }    ← ownedTokensCount
  lsp12IssuedAssets_aggregate { aggregate { count } } ← issuedAssetsCount
  dataChanged_aggregate { aggregate { count } }    ← dataChangedCount
  universalReceiver_aggregate { aggregate { count } } ← universalReceiverCount
  lsp29EncryptedAssets_aggregate { aggregate { count } } ← encryptedAssetsCount
}
```

**Proposed TypeScript type shape:**

```typescript
export const ProfileStatsSchema = z.object({
  address: z.string(),
  followerCount: z.number(), // followedBy_aggregate.aggregate.count
  followingCount: z.number(), // followed_aggregate.aggregate.count
  ownedAssetsCount: z.number(), // ownedAssets_aggregate.aggregate.count
  ownedTokensCount: z.number(), // ownedTokens_aggregate.aggregate.count
  issuedAssetsCount: z.number(), // lsp12IssuedAssets_aggregate.aggregate.count
  dataChangedCount: z.number(), // dataChanged_aggregate.aggregate.count
  universalReceiverCount: z.number(), // universalReceiver_aggregate.aggregate.count
  encryptedAssetsCount: z.number(), // lsp29EncryptedAssets_aggregate.aggregate.count
});
```

**Hooks:**

- `useProfileStats({ address })` — single profile stats (NO infinite variant)
- No `useProfileStatsList` — not meaningful

**GraphQL document pattern:**

```graphql
query GetProfileStats($where: universal_profile_bool_exp!) {
  universal_profile(where: $where, limit: 1) {
    address
    followedBy_aggregate {
      aggregate {
        count
      }
    }
    followed_aggregate {
      aggregate {
        count
      }
    }
    ownedAssets_aggregate {
      aggregate {
        count
      }
    }
    ownedTokens_aggregate {
      aggregate {
        count
      }
    }
    lsp12IssuedAssets_aggregate {
      aggregate {
        count
      }
    }
    dataChanged_aggregate {
      aggregate {
        count
      }
    }
    universalReceiver_aggregate {
      aggregate {
        count
      }
    }
    lsp29EncryptedAssets_aggregate {
      aggregate {
        count
      }
    }
  }
}
```

**Domain-specific pitfalls:**

- `followedBy_aggregate` uses `follow_aggregate` (NOT `follower_aggregate`) — this is the historical follow log. Equivalent for count purposes.
- `universalReceiver` is a relation on `universal_profile` (not the top-level `universal_receiver` table). The relation is `universal_profile.universalReceiver`.
- All aggregate counts can be null if no records exist — always default to 0.
- This is a SINGLE aggregate row, never a list — `useProfileStats` returns `{ stats: ProfileStats | null }`.
- Service function: `fetchProfileStats(url, { address }): Promise<ProfileStats | null>`

---

## Pagination Notes

### Offset-Based Pattern (All List Domains)

The `useInfiniteProfiles` pattern from Phase 8 applies universally:

```typescript
getNextPageParam: (lastPage, _allPages, lastPageParam) => {
  if (lastPage.items.length < pageSize) return undefined;
  return lastPageParam + pageSize;
};
```

### Event Domains (DataChanged, UniversalReceiver)

Event domains MUST default to `block_number DESC` sort (newest first) in `buildXOrderBy`:

```typescript
function buildDataChangedOrderBy(sort?: DataChangedSort): Data_Changed_Order_By[] {
  if (!sort) return [{ block_number: 'desc' }]; // Default: newest first
  switch (sort.field) {
    case 'blockNumber':
      return [{ block_number: sort.direction }];
    case 'timestamp':
      return [{ timestamp: sort.direction }];
  }
}
```

### Aggregate Queries for Pagination

All list domains include `{table}_aggregate(where: $where) { aggregate { count } }` for `totalCount`. The aggregate MUST use the same `$where` variable as the data query.

### Domains WITHOUT infinite scroll

- `useProfileStats` — scalar stats object, not a list
- `useFollowCount` — scalar count pair, not a list

---

## Navigation (apps/test/src/components/nav.tsx)

**Current state:** Nav already has placeholder entries for 9 domains with `available: false`. Full list:

```
/          → Home (available: true)
/profiles  → Profiles (available: true) ← Phase 8 complete
/assets    → Digital Assets (available: false) ← Domain 1
/nfts      → NFTs (available: false) ← Domain 2
/owned     → Owned Assets (available: false) ← Domain 3
/follows   → Follows (available: false) ← Domain 4
/creators  → Creators (available: false) ← Domain 5
/encrypted → Encrypted Assets (available: false) ← Domain 6
/events    → Events (available: false) ← Domain 8+9 combined? or separate?
/stats     → Stats (available: false) ← Domain 10
```

**Missing from nav:** `/feed` for Domain 7 (Encrypted Asset Feed). The nav needs a new entry.

**Integration plan should:** Set all 9 existing to `available: true`, add `/feed` entry for Domain 7. The `/events` route covers both Domain 8 (DataChanged) and Domain 9 (UniversalReceiver) — either two tabs within `/events`, or use `/data-changed` and `/receiver` separately.

**Recommendation:** Use `/events/data-changed` and `/events/receiver` OR a tabbed `/events` page. Claude's discretion.

---

## Key Factory Pattern (Per Domain)

Each domain key factory follows profiles exactly. The pattern for a domain that has a single-item fetch:

```typescript
export const digitalAssetKeys = {
  all: ['digitalAssets'] as const,
  details: () => [...digitalAssetKeys.all, 'detail'] as const,
  detail: (address: string) => [...digitalAssetKeys.details(), { address }] as const,
  lists: () => [...digitalAssetKeys.all, 'list'] as const,
  list: (filter?, sort?, limit?, offset?) =>
    [...digitalAssetKeys.lists(), { filter, sort, limit, offset }] as const,
  infinites: () => [...digitalAssetKeys.all, 'infinite'] as const,
  infinite: (filter?, sort?) => [...digitalAssetKeys.infinites(), { filter, sort }] as const,
} as const;
```

Domains without a single-item fetch (EncryptedAssetFeed, Creators, DataChangedEvents, UniversalReceiverEvents) omit `detail`/`details`.
Domains with a non-address single-item key (Nft: `{ address, tokenId }`) use the composite as the detail key.

---

## Setup Plan Notes

The setup plan runs BEFORE all domain plans:

1. **`pnpm schema:dump`** — dumps current Hasura schema to `packages/node/schema.graphql`
2. **Codegen** — runs `pnpm codegen` (or similar) to regenerate `packages/node/src/graphql/graphql.ts`
3. **Commit generated files** — all domain plans depend on this consistent generated state

Check `packages/node/package.json` for exact codegen script name.

---

## GraphQL Document Strategy: @include Directives

**Recommendation: Do NOT use @include for Phase 9 domains.** The Profile domain uses @include because it has 9 optional nested fields that could create heavy queries. For the remaining domains:

- **Digital Assets:** Include all fields. Metadata images are limited to 5.
- **NFTs:** Include all fields. Skip base URI metadata in default query.
- **Owned Assets/Tokens:** All fields are scalar or single-level relations — no @include needed.
- **Follows:** Optionally include profile names via nested profile query. @include useful here.
- **Creators:** Include creator profile name. @include useful if profile name is optional.
- **Encrypted Assets:** All fields included. Encryption/chunks are object relations with few fields.
- **Encrypted Feed:** Only 4 scalar fields — no @include needed.
- **DataChanged/UniversalReceiver:** All scalar fields — no @include needed.
- **ProfileStats:** Pure aggregates — no @include needed.

---

## Open Questions

1. **`/events` route structure:** Should DataChanged and UniversalReceiver be separate pages (`/data-changed` and `/receiver`) or a tabbed `/events` page? The nav currently has one `/events` entry. Claude's discretion — recommend tabbed `/events` to avoid expanding nav.

2. **`useNftsByCollection` hook name:** The context specifies this as a distinct hook name. Implement as a convenience wrapper around `useNfts` with the collection address pre-filled as a filter. Does NOT need a separate GraphQL document.

3. **`useCreators` vs `useCreatorAddresses`:** Original domain spec says `useCreatorAddresses`. Confirm naming with planner — `useCreators` is more consistent with domain-entity naming (compare: `useProfiles`, `useNfts`, `useFollowers`).

4. **Event page grouping:** DataChanged (Domain 8) and UniversalReceiver (Domain 9) — are these one domain plan or two? CONTEXT.md says 10 domain plans (one per domain), so separate plans. Both can set `available: true` on the same `/events` nav entry (or one sets it, the other adds a tab).

5. **`lsp29_encrypted_asset.address` semantics:** Confirmed = publisher's UP address. But the field is named `address` which is ambiguous. Document clearly in JSDoc.

---

## Sources

### Primary (HIGH confidence)

- `packages/node/schema.graphql` — authoritative Hasura schema, all field names verified directly
- `packages/node/src/graphql/graphql.ts` — codegen output, all Bool_Exp and Order_By types verified
- `packages/types/src/profiles.ts` — Zod schema pattern reference
- `packages/node/src/services/profiles.ts` — service pattern reference
- `packages/node/src/documents/profiles.ts` — GraphQL document pattern reference
- `packages/react/src/hooks/profiles.ts` — hook pattern reference
- `packages/next/src/actions/profiles.ts` — action pattern reference
- `packages/next/src/hooks/profiles.ts` — next hook pattern reference
- `apps/test/src/components/nav.tsx` — navigation structure
- `.planning/phases/09-remaining-query-domains/09-CONTEXT.md` — locked decisions

### Secondary (MEDIUM confidence)

N/A — all findings from primary codebase sources.

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — directly from schema.graphql and graphql.ts codegen
- Architecture: HIGH — Phase 8 pattern fully proven
- Field names: HIGH — verified in schema.graphql
- Type shapes: HIGH — derived from schema types + Bool_Exp filter fields
- Pitfalls: HIGH — identified from schema nuances (follow vs follower, string vs int for tokenType)

**Research date:** 2026-02-19
**Valid until:** Stable until next `schema:dump` changes the Hasura schema
