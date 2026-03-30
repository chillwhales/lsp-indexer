---
estimated_steps: 36
estimated_files: 7
skills_used: []
---

# T01: Types + Node: collection-attributes schemas, document, codegen, service, keys

Create the collection-attributes domain foundation: Zod schemas/types in the types package, a new GraphQL document with distinct_on + nft_aggregate, run codegen, then build the service function and key factory in the node package.

## Steps

1. Create `packages/types/src/collection-attributes.ts` with:
   - `CollectionAttributeSchema` — `z.object({ key: z.string(), value: z.string(), type: z.string().nullable() })`
   - `CollectionAttributesResultSchema` — `z.object({ attributes: z.array(CollectionAttributeSchema), totalCount: z.number() })`
   - `UseCollectionAttributesParamsSchema` — `z.object({ collectionAddress: z.string() })`
   - Export inferred types: `CollectionAttribute`, `CollectionAttributesResult`, `UseCollectionAttributesParams`

2. Add `export * from './collection-attributes'` to `packages/types/src/index.ts` (alphabetical, between `common` and `creators`).

3. Verify types build: `pnpm --filter=@lsp-indexer/types build`

4. Create `packages/node/src/documents/collection-attributes.ts` with a tagged GraphQL document string `GetCollectionAttributes` containing two root queries:
   - `lsp4_metadata_attribute(distinct_on: $distinctOn, order_by: [{key: asc}, {value: asc}], where: { lsp4Metadata: { address: { _ilike: $collectionAddress } } })` selecting `key`, `value`, `type`
   - `nft_aggregate(where: { address: { _ilike: $collectionAddress } })` selecting `aggregate { count }`
   - Variables: `$collectionAddress: String!`, `$distinctOn: [lsp4_metadata_attribute_select_column!]`
   - Use the `TypedDocumentString` constructor from `../graphql/graphql` (follow existing document patterns e.g. `packages/node/src/documents/followers.ts`)

5. Run codegen: `pnpm --filter=@lsp-indexer/node codegen`

6. Create `packages/node/src/services/collection-attributes.ts`:
   - Import `execute`, `escapeLike` from client, `GetCollectionAttributesDocument` from codegen output, types from `@lsp-indexer/types`
   - Export `fetchCollectionAttributes(url: string, params: { collectionAddress: string }): Promise<CollectionAttributesResult>`
   - Pass `distinct_on: ['key', 'value']` (using the string literal values from codegen enum) and `collectionAddress: escapeLike(params.collectionAddress)`
   - Map result: `attributes` from the `lsp4_metadata_attribute` array (map each to `{ key, value, type }`), `totalCount` from `nft_aggregate.aggregate.count ?? 0`

7. Create `packages/node/src/keys/collection-attributes.ts`:
   - Export `collectionAttributeKeys` object with:
     - `all: ['collection-attributes'] as const`
     - `lists: () => [...collectionAttributeKeys.all, 'list'] as const`
     - `list: (collectionAddress: string) => [...collectionAttributeKeys.lists(), collectionAddress] as const`

8. Add barrel exports to `packages/node/src/index.ts`:
   - `export * from './services/collection-attributes'` (in Services section, alphabetical)
   - `export * from './keys/collection-attributes'` (in Keys section, alphabetical)
   - `export * from './documents/collection-attributes'` (in Documents section, alphabetical)

9. Verify node build: `pnpm --filter=@lsp-indexer/node build`

## Must-Haves

- [ ] `CollectionAttributeSchema`, `CollectionAttributesResultSchema`, `UseCollectionAttributesParamsSchema` exported from types
- [ ] GraphQL document uses `distinct_on` with matching `order_by` (Hasura requirement)
- [ ] `fetchCollectionAttributes` uses `escapeLike` for address
- [ ] Codegen runs clean after document addition
- [ ] Both `types` and `node` packages build clean

## Inputs

- `packages/types/src/index.ts`
- `packages/types/src/followers.ts`
- `packages/node/src/index.ts`
- `packages/node/src/documents/followers.ts`
- `packages/node/src/services/followers.ts`
- `packages/node/src/keys/followers.ts`
- `packages/node/src/graphql/graphql.ts`
- `packages/node/codegen.ts`

## Expected Output

- `packages/types/src/collection-attributes.ts`
- `packages/types/src/index.ts`
- `packages/node/src/documents/collection-attributes.ts`
- `packages/node/src/graphql/graphql.ts`
- `packages/node/src/services/collection-attributes.ts`
- `packages/node/src/keys/collection-attributes.ts`
- `packages/node/src/index.ts`

## Verification

pnpm --filter=@lsp-indexer/types build && pnpm --filter=@lsp-indexer/node codegen && pnpm --filter=@lsp-indexer/node build
