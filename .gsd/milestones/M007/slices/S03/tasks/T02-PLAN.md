---
estimated_steps: 43
estimated_files: 13
skills_used: []
---

# T02: React + Next: collection-attributes factory, hooks, action, barrel exports, full build

Wire the consumer packages: React factory + concrete hook + return type, Next.js server action + hook, all barrel exports, and verify with full `pnpm build`.

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

## Inputs

- `packages/types/src/collection-attributes.ts`
- `packages/node/src/services/collection-attributes.ts`
- `packages/node/src/keys/collection-attributes.ts`
- `packages/node/src/graphql/graphql.ts`
- `packages/react/src/hooks/types/index.ts`
- `packages/react/src/hooks/types/followers.ts`
- `packages/react/src/hooks/factories/followers/create-use-follow-count.ts`
- `packages/react/src/hooks/factories/index.ts`
- `packages/react/src/hooks/followers/use-follow-count.ts`
- `packages/react/src/hooks/index.ts`
- `packages/next/src/actions/followers.ts`
- `packages/next/src/actions/index.ts`
- `packages/next/src/hooks/followers/use-follow-count.ts`
- `packages/next/src/hooks/index.ts`

## Expected Output

- `packages/react/src/hooks/types/collection-attributes.ts`
- `packages/react/src/hooks/types/index.ts`
- `packages/react/src/hooks/factories/collection-attributes/create-use-collection-attributes.ts`
- `packages/react/src/hooks/factories/collection-attributes/index.ts`
- `packages/react/src/hooks/factories/index.ts`
- `packages/react/src/hooks/collection-attributes/use-collection-attributes.ts`
- `packages/react/src/hooks/collection-attributes/index.ts`
- `packages/react/src/hooks/index.ts`
- `packages/next/src/actions/collection-attributes.ts`
- `packages/next/src/actions/index.ts`
- `packages/next/src/hooks/collection-attributes/use-collection-attributes.ts`
- `packages/next/src/hooks/collection-attributes/index.ts`
- `packages/next/src/hooks/index.ts`

## Verification

pnpm --filter=@lsp-indexer/react build && pnpm --filter=@lsp-indexer/next build && pnpm build
