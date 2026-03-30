# S03: Collection attributes vertical

**Goal:** Expose collection attributes (distinct {key, value} pairs + totalCount) through the full package stack: types → node (document, codegen, service, keys) → react (factory, hook) → next (action, hook).
**Demo:** After this: After this: getCollectionAttributes server action returns distinct {key, value} pairs + totalCount for a collection address; useCollectionAttributes hook available.

## Tasks
- [x] **T01: Added collection-attributes domain foundation: Zod schemas in types, GraphQL document with distinct_on + nft_aggregate, codegen, service function with escapeLike, and query key factory in node** — Create the collection-attributes domain foundation: Zod schemas/types in the types package, a new GraphQL document with distinct_on + nft_aggregate, run codegen, then build the service function and key factory in the node package.

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
  - Estimate: 30m
  - Files: packages/types/src/collection-attributes.ts, packages/types/src/index.ts, packages/node/src/documents/collection-attributes.ts, packages/node/src/graphql/graphql.ts, packages/node/src/services/collection-attributes.ts, packages/node/src/keys/collection-attributes.ts, packages/node/src/index.ts
  - Verify: pnpm --filter=@lsp-indexer/types build && pnpm --filter=@lsp-indexer/node codegen && pnpm --filter=@lsp-indexer/node build
- [ ] **T02: React + Next: collection-attributes factory, hooks, action, barrel exports, full build** — Wire the consumer packages: React factory + concrete hook + return type, Next.js server action + hook, all barrel exports, and verify with full `pnpm build`.

## Steps

1. Create `packages/react/src/hooks/types/collection-attributes.ts`:
   - Import `UseQueryResult` from `@tanstack/react-query`, `CollectionAttributesResult` from `@lsp-indexer/types`
   - Export `UseCollectionAttributesReturn = { attributes: CollectionAttribute[]; totalCount: number; } & Omit<UseQueryResult<CollectionAttributesResult, Error>, 'data'>`

2. Add `export * from './collection-attributes'` to `packages/react/src/hooks/types/index.ts` (alphabetical, between `creators` and `data-changed-events`).

3. Create `packages/react/src/hooks/factories/collection-attributes/create-use-collection-attributes.ts`:
   - Import `collectionAttributeKeys` from `@lsp-indexer/node`, types from `@lsp-indexer/types`, `useQuery` from `@tanstack/react-query`, return type from `../../types`
   - Export `createUseCollectionAttributes(queryFn: (collectionAddress: string) => Promise<CollectionAttributesResult>)`
   - Inside, define `useCollectionAttributes(params: UseCollectionAttributesParams): UseCollectionAttributesReturn`
   - Use `useQuery` with `queryKey: collectionAttributeKeys.list(collectionAddress)`, `queryFn: () => queryFn(collectionAddress)`, `enabled: Boolean(collectionAddress)`
   - Destructure `{ data, ...rest }`, return `{ attributes: data?.attributes ?? [], totalCount: data?.totalCount ?? 0, ...rest }`

4. Create `packages/react/src/hooks/factories/collection-attributes/index.ts` — barrel export.

5. Add `export * from './collection-attributes'` to `packages/react/src/hooks/factories/index.ts` (alphabetical, between `creators` and `data-changed-events`).

6. Create `packages/react/src/hooks/collection-attributes/use-collection-attributes.ts`:
   - Import `fetchCollectionAttributes`, `getClientUrl` from `@lsp-indexer/node`
   - Import `createUseCollectionAttributes` from `../factories`
   - Export `useCollectionAttributes = createUseCollectionAttributes((collectionAddress) => fetchCollectionAttributes(getClientUrl(), { collectionAddress }))`

7. Create `packages/react/src/hooks/collection-attributes/index.ts` — barrel export.

8. Add `export * from './collection-attributes'` to `packages/react/src/hooks/index.ts` (alphabetical, between `creators` and `data-changed-events`).

9. Verify react build: `pnpm --filter=@lsp-indexer/react build`

10. Create `packages/next/src/actions/collection-attributes.ts`:
    - `'use server'` directive
    - Import `fetchCollectionAttributes`, `getServerUrl` from `@lsp-indexer/node`
    - Import `UseCollectionAttributesParamsSchema`, `CollectionAttributesResult` from `@lsp-indexer/types`
    - Import `validateInput` from `../validation`
    - Export `getCollectionAttributes(collectionAddress: string): Promise<CollectionAttributesResult>`
    - Validate with `validateInput(UseCollectionAttributesParamsSchema, { collectionAddress }, 'getCollectionAttributes')`
    - Return `fetchCollectionAttributes(getServerUrl(), { collectionAddress })`

11. Add `export * from './collection-attributes'` to `packages/next/src/actions/index.ts` (alphabetical).

12. Create `packages/next/src/hooks/collection-attributes/use-collection-attributes.ts`:
    - Import `createUseCollectionAttributes` from `@lsp-indexer/react`
    - Import `getCollectionAttributes` from `../../actions`
    - Export `useCollectionAttributes = createUseCollectionAttributes(getCollectionAttributes)`

13. Create `packages/next/src/hooks/collection-attributes/index.ts` — barrel export.

14. Add `export * from './collection-attributes'` to `packages/next/src/hooks/index.ts` (alphabetical).

15. Verify full build: `pnpm build` — all workspace projects pass.

## Must-Haves

- [ ] `createUseCollectionAttributes` factory exported from react
- [ ] `useCollectionAttributes` concrete hook exported from react
- [ ] `getCollectionAttributes` server action exported from next
- [ ] `useCollectionAttributes` Next.js hook exported from next
- [ ] `pnpm build` passes all workspace projects
  - Estimate: 30m
  - Files: packages/react/src/hooks/types/collection-attributes.ts, packages/react/src/hooks/types/index.ts, packages/react/src/hooks/factories/collection-attributes/create-use-collection-attributes.ts, packages/react/src/hooks/factories/collection-attributes/index.ts, packages/react/src/hooks/factories/index.ts, packages/react/src/hooks/collection-attributes/use-collection-attributes.ts, packages/react/src/hooks/collection-attributes/index.ts, packages/react/src/hooks/index.ts, packages/next/src/actions/collection-attributes.ts, packages/next/src/actions/index.ts, packages/next/src/hooks/collection-attributes/use-collection-attributes.ts, packages/next/src/hooks/collection-attributes/index.ts, packages/next/src/hooks/index.ts
  - Verify: pnpm --filter=@lsp-indexer/react build && pnpm --filter=@lsp-indexer/next build && pnpm build
