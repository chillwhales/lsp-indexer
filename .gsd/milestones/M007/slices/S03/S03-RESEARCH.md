# S03 — Collection Attributes Vertical — Research

**Date:** 2026-03-30

## Summary

S03 adds a new "collection attributes" domain vertical — a standalone query that fetches all distinct `{key, value}` pairs for a collection's NFTs plus the total NFT count. This is a straightforward new domain following established patterns (follow-count is the closest analog: simple query → service → key → action → hook, no include narrowing needed).

The Hasura schema fully supports this: `lsp4_metadata_attribute` is a top-level query with `distinct_on` support, and both `key` and `value` are in the `Lsp4_Metadata_Attribute_Select_Column` enum. The `nft_aggregate` query provides total count. No codegen changes needed since the existing raw types already cover `lsp4_metadata_attribute` and `nft_aggregate`.

## Recommendation

Build the vertical in dependency order: types (Zod schemas + params) → node (document + service + keys) → react (factory + hook) → next (action + hook). Use a single new GraphQL document with two root queries: `lsp4_metadata_attribute` with `distinct_on: [key, value]` for attributes, and `nft_aggregate` for total count. Follow the follow-count pattern (direct `useQuery`, no `createUseList`) since results are a flat list with no pagination or include narrowing.

## Implementation Landscape

### Key Files

**Types package** (`packages/types/src/`):
- `collection-attributes.ts` — **NEW.** `CollectionAttributeSchema` (`{key, value, type}`), `CollectionAttributesResultSchema` (`{attributes, totalCount}`), `UseCollectionAttributesParamsSchema` (`{collectionAddress}`). Types: `CollectionAttribute`, `CollectionAttributesResult`, `UseCollectionAttributesParams`.
- `index.ts` — Add `export * from './collection-attributes'`.

**Node package** (`packages/node/src/`):
- `documents/collection-attributes.ts` — **NEW.** GraphQL document `GetCollectionAttributes` with two root queries:
  ```graphql
  query GetCollectionAttributes($collectionAddress: String!, $distinctOn: [lsp4_metadata_attribute_select_column!]) {
    lsp4_metadata_attribute(
      distinct_on: $distinctOn,
      order_by: [{ key: asc }, { value: asc }],
      where: { lsp4Metadata: { address: { _ilike: $collectionAddress } } }
    ) { key value type }
    nft_aggregate(where: { address: { _ilike: $collectionAddress } }) {
      aggregate { count }
    }
  }
  ```
  Note: Hasura requires `order_by` to start with `distinct_on` columns when using `distinct_on`. So `order_by: [{key: asc}, {value: asc}]` is mandatory with `distinct_on: [key, value]`.
- `services/collection-attributes.ts` — **NEW.** `fetchCollectionAttributes(url, { collectionAddress })` → calls `execute` with `GetCollectionAttributesDocument`, passes `distinct_on: [Lsp4_Metadata_Attribute_Select_Column.Key, Lsp4_Metadata_Attribute_Select_Column.Value]`, returns `CollectionAttributesResult`.
- `keys/collection-attributes.ts` — **NEW.** Simple key factory: `collectionAttributeKeys.all`, `.list(collectionAddress)`.
- `index.ts` — Add exports for new document, service, keys.

**Codegen:** Run `pnpm --filter=@lsp-indexer/node codegen` after adding the document to get typed document + result types in `graphql/graphql.ts`.

**React package** (`packages/react/src/`):
- `hooks/factories/collection-attributes/create-use-collection-attributes.ts` — **NEW.** Factory using direct `useQuery` (follow-count pattern). Takes `queryFn: (collectionAddress: string) => Promise<CollectionAttributesResult>`.
- `hooks/factories/collection-attributes/index.ts` — **NEW.** Barrel export.
- `hooks/collection-attributes/use-collection-attributes.ts` — **NEW.** Concrete hook using `createUseCollectionAttributes` with `fetchCollectionAttributes`.
- `hooks/collection-attributes/index.ts` — **NEW.** Barrel export.
- `hooks/types/collection-attributes.ts` — **NEW.** `UseCollectionAttributesReturn` type.
- Update barrel exports: `hooks/factories/index.ts`, `hooks/index.ts`, `hooks/types/index.ts`.

**Next package** (`packages/next/src/`):
- `actions/collection-attributes.ts` — **NEW.** `getCollectionAttributes` server action.
- `hooks/collection-attributes/use-collection-attributes.ts` — **NEW.** Next.js hook wiring `createUseCollectionAttributes(getCollectionAttributes)`.
- `hooks/collection-attributes/index.ts` — **NEW.** Barrel export.
- Update barrel exports: `actions/index.ts`, `hooks/index.ts`.

### Build Order

1. **Types** — Define schemas and types. Zero dependencies. Verified by `pnpm --filter=@lsp-indexer/types build`.
2. **Node document + codegen** — Write GraphQL document, run codegen, write parser/service/keys. Verified by `pnpm --filter=@lsp-indexer/node codegen && pnpm --filter=@lsp-indexer/node build`.
3. **React factory + hook + types** — Wire up factory and concrete hook. Verified by `pnpm --filter=@lsp-indexer/react build`.
4. **Next action + hook** — Wire server action and Next.js hook. Verified by `pnpm --filter=@lsp-indexer/next build`.
5. **Full build** — `pnpm build` across all 9 workspace projects.

### Constraints and Gotchas

- **`distinct_on` requires matching `order_by`:** Hasura enforces that `order_by` starts with the `distinct_on` columns. The query MUST have `order_by: [{ key: asc }, { value: asc }]` when using `distinct_on: [key, value]`.
- **`_ilike` for address matching:** Existing convention uses `_ilike` with `escapeLike()` for address comparisons (case-insensitive). Collection address filter must follow this pattern.
- **`lsp4_metadata.address` is the collection address:** `lsp4_metadata_attribute` → `lsp4Metadata` → `address` traverses to the digital asset address. All NFTs in a collection share the same digital asset address in their metadata.
- **No parser needed beyond simple mapping:** The raw `lsp4_metadata_attribute` fields (`key`, `value`, `type`) map directly to `CollectionAttribute` — no include-based stripping or complex parsing needed. A simple inline map in the service function suffices.
- **No pagination:** Collection attributes are a finite, bounded set (typically 5-15 trait types × N values). No offset/limit or infinite scroll needed.
- **Codegen required:** The new document must be followed by `pnpm --filter=@lsp-indexer/node codegen` to generate typed operations before the service can reference `GetCollectionAttributesDocument`.

### Patterns to Follow

- **follow-count** for service shape (simple `execute` + return, no include overloads)
- **follow-count** for React factory (direct `useQuery`, no `createUseList`)
- **follow-count** for Next.js action (simple pass-through with `validateInput`)
- **Barrel export pattern** from every existing domain (alphabetical insertion in index files)
