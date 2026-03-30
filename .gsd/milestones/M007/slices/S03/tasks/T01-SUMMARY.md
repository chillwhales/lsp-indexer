---
id: T01
parent: S03
milestone: M007
provides: []
requires: []
affects: []
key_files: ["packages/types/src/collection-attributes.ts", "packages/node/src/documents/collection-attributes.ts", "packages/node/src/services/collection-attributes.ts", "packages/node/src/keys/collection-attributes.ts", "packages/node/src/graphql/graphql.ts", "packages/types/src/index.ts", "packages/node/src/index.ts"]
key_decisions: ["Used distinct_on: ['key', 'value'] to deduplicate attribute pairs across all NFTs in a collection", "Mapped nullable key/value from Hasura to empty strings in the service layer to satisfy the non-nullable Zod schema"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Full verification chain passed: pnpm --filter=@lsp-indexer/types build && pnpm --filter=@lsp-indexer/node codegen && pnpm --filter=@lsp-indexer/node build — all exit 0 with clean output."
completed_at: 2026-03-30T11:20:03.904Z
blocker_discovered: false
---

# T01: Added collection-attributes domain foundation: Zod schemas in types, GraphQL document with distinct_on + nft_aggregate, codegen, service function with escapeLike, and query key factory in node

> Added collection-attributes domain foundation: Zod schemas in types, GraphQL document with distinct_on + nft_aggregate, codegen, service function with escapeLike, and query key factory in node

## What Happened
---
id: T01
parent: S03
milestone: M007
key_files:
  - packages/types/src/collection-attributes.ts
  - packages/node/src/documents/collection-attributes.ts
  - packages/node/src/services/collection-attributes.ts
  - packages/node/src/keys/collection-attributes.ts
  - packages/node/src/graphql/graphql.ts
  - packages/types/src/index.ts
  - packages/node/src/index.ts
key_decisions:
  - Used distinct_on: ['key', 'value'] to deduplicate attribute pairs across all NFTs in a collection
  - Mapped nullable key/value from Hasura to empty strings in the service layer to satisfy the non-nullable Zod schema
duration: ""
verification_result: passed
completed_at: 2026-03-30T11:20:03.905Z
blocker_discovered: false
---

# T01: Added collection-attributes domain foundation: Zod schemas in types, GraphQL document with distinct_on + nft_aggregate, codegen, service function with escapeLike, and query key factory in node

**Added collection-attributes domain foundation: Zod schemas in types, GraphQL document with distinct_on + nft_aggregate, codegen, service function with escapeLike, and query key factory in node**

## What Happened

Created the full types → document → codegen → service → keys vertical for collection-attributes. Types package exports CollectionAttributeSchema, CollectionAttributesResultSchema, and UseCollectionAttributesParamsSchema. Node package exports GetCollectionAttributesDocument (using distinct_on with matching order_by for Hasura), fetchCollectionAttributes service with escapeLike, and collectionAttributeKeys factory. Codegen ran clean and both packages build successfully.

## Verification

Full verification chain passed: pnpm --filter=@lsp-indexer/types build && pnpm --filter=@lsp-indexer/node codegen && pnpm --filter=@lsp-indexer/node build — all exit 0 with clean output.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `pnpm --filter=@lsp-indexer/types build` | 0 | ✅ pass | 1000ms |
| 2 | `pnpm --filter=@lsp-indexer/node codegen` | 0 | ✅ pass | 1500ms |
| 3 | `pnpm --filter=@lsp-indexer/node build` | 0 | ✅ pass | 4000ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `packages/types/src/collection-attributes.ts`
- `packages/node/src/documents/collection-attributes.ts`
- `packages/node/src/services/collection-attributes.ts`
- `packages/node/src/keys/collection-attributes.ts`
- `packages/node/src/graphql/graphql.ts`
- `packages/types/src/index.ts`
- `packages/node/src/index.ts`


## Deviations
None.

## Known Issues
None.
