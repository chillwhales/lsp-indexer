---
id: S03
parent: M007
milestone: M007
provides:
  - fetchCollectionAttributes service function
  - collectionAttributeKeys query key factory
  - createUseCollectionAttributes React factory
  - useCollectionAttributes React hook
  - getCollectionAttributes Next.js server action
  - useCollectionAttributes Next.js hook
  - CollectionAttribute, CollectionAttributesResult, UseCollectionAttributesParams types
requires:
  - slice: S01
    provides: Base NFT type extensions and Lsp4Attribute schema that collection-attributes queries against
affects:
  - S04
key_files:
  - packages/types/src/collection-attributes.ts
  - packages/node/src/documents/collection-attributes.ts
  - packages/node/src/services/collection-attributes.ts
  - packages/node/src/keys/collection-attributes.ts
  - packages/react/src/hooks/factories/collection-attributes/create-use-collection-attributes.ts
  - packages/react/src/hooks/collection-attributes/use-collection-attributes.ts
  - packages/next/src/actions/collection-attributes.ts
  - packages/next/src/hooks/collection-attributes/use-collection-attributes.ts
  - packages/react/src/hooks/types/collection-attributes.ts
key_decisions:
  - Used distinct_on: ['key', 'value'] for Hasura attribute deduplication across all NFTs in a collection
  - Mapped nullable key/value from Hasura to empty strings in service layer to satisfy non-nullable Zod schema
  - Followed simple-query pattern (like useFollowCount) — direct useQuery, no pagination/infinite scroll
patterns_established:
  - Collection-attributes vertical: new simple-query domain pattern using distinct_on + aggregate count, useful as reference for future non-paginated aggregate queries
observability_surfaces:
  - none
drill_down_paths:
  - .gsd/milestones/M007/slices/S03/tasks/T01-SUMMARY.md
  - .gsd/milestones/M007/slices/S03/tasks/T02-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-30T11:24:15.536Z
blocker_discovered: false
---

# S03: Collection attributes vertical

**Delivered full-stack collection-attributes query: Zod schemas, GraphQL document with distinct_on + nft_aggregate, codegen, service with escapeLike, key factory, React factory/hook, Next.js server action/hook — all barrel-exported, full pnpm build passing.**

## What Happened

Built the collection-attributes domain from scratch through the entire 4-package stack (types → node → react → next), following the established simple-query pattern (similar to useFollowCount).

**T01 — Foundation (types + node):** Created CollectionAttributeSchema, CollectionAttributesResultSchema, and UseCollectionAttributesParamsSchema in the types package. Added a new GraphQL document (GetCollectionAttributes) with two root queries: lsp4_metadata_attribute using distinct_on: ['key', 'value'] with matching order_by for Hasura compliance, and nft_aggregate for total NFT count. Ran codegen, built fetchCollectionAttributes service function with escapeLike for address safety, and added collectionAttributeKeys factory. Types and node packages build clean.

**T02 — Consumer stack (react + next):** Created UseCollectionAttributesReturn type, createUseCollectionAttributes factory using useQuery with enabled guard on collectionAddress, concrete React hook wiring fetchCollectionAttributes + getClientUrl, Next.js server action with 'use server' + Zod validation via validateInput, and Next.js hook routing through the server action. All barrel exports added alphabetically across 9 index files. Full pnpm build passes across all workspace packages including docs.

## Verification

Full workspace build verified: `pnpm build` exits 0 — all 9 packages (types, node, react, next, abi, typeorm, indexer, comparison-tool, docs) compile clean. Barrel exports confirmed present in all 5 consumer packages (types, node, react, next) plus 4 internal barrel files (hooks/index, hooks/types/index, hooks/factories/index, actions/index).

## Requirements Advanced

- R022 — Full stack delivered: fetchCollectionAttributes service, getCollectionAttributes server action, useCollectionAttributes React/Next.js hooks — all returning distinct {key, value} pairs + totalCount
- R025 — Collection-attributes propagated through all 4 consumer packages with clean full-workspace build

## Requirements Validated

- R022 — pnpm build passes across all 9 packages; barrel exports confirmed in types, node, react, next; GraphQL document uses distinct_on with matching order_by; service uses escapeLike; server action validates with Zod

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

- `packages/types/src/collection-attributes.ts` — New file: CollectionAttributeSchema, CollectionAttributesResultSchema, UseCollectionAttributesParamsSchema
- `packages/types/src/index.ts` — Added collection-attributes barrel export
- `packages/node/src/documents/collection-attributes.ts` — New file: GetCollectionAttributesDocument with distinct_on + nft_aggregate
- `packages/node/src/services/collection-attributes.ts` — New file: fetchCollectionAttributes with escapeLike
- `packages/node/src/keys/collection-attributes.ts` — New file: collectionAttributeKeys factory
- `packages/node/src/index.ts` — Added service, keys, document barrel exports
- `packages/node/src/graphql/graphql.ts` — Codegen-updated with GetCollectionAttributes types
- `packages/react/src/hooks/types/collection-attributes.ts` — New file: UseCollectionAttributesReturn type
- `packages/react/src/hooks/types/index.ts` — Added collection-attributes barrel export
- `packages/react/src/hooks/factories/collection-attributes/create-use-collection-attributes.ts` — New file: createUseCollectionAttributes factory
- `packages/react/src/hooks/factories/collection-attributes/index.ts` — New file: factory barrel
- `packages/react/src/hooks/factories/index.ts` — Added collection-attributes barrel export
- `packages/react/src/hooks/collection-attributes/use-collection-attributes.ts` — New file: concrete useCollectionAttributes React hook
- `packages/react/src/hooks/collection-attributes/index.ts` — New file: hook barrel
- `packages/react/src/hooks/index.ts` — Added collection-attributes barrel export
- `packages/next/src/actions/collection-attributes.ts` — New file: getCollectionAttributes server action with Zod validation
- `packages/next/src/actions/index.ts` — Added collection-attributes barrel export
- `packages/next/src/hooks/collection-attributes/use-collection-attributes.ts` — New file: Next.js useCollectionAttributes hook via server action
- `packages/next/src/hooks/collection-attributes/index.ts` — New file: hook barrel
- `packages/next/src/hooks/index.ts` — Added collection-attributes barrel export
