# T03: 09.1-digital-assets 03

**Slice:** S13 — **Milestone:** M001

## Description

Create the consumer-facing hooks for both @lsp-indexer/react and @lsp-indexer/next, server actions, and wire all digital asset exports through every package entry point — making the full API available for import.

Purpose: This plan makes everything usable. React hooks wrap TanStack Query around the service functions for direct browser→Hasura calls. Next.js hooks use server actions as queryFn for browser→server→Hasura routing. Entry points expose the right things from the right packages.

Output: `hooks/digital-assets.ts` in @lsp-indexer/react with 3 hooks, `actions/digital-assets.ts` + `hooks/digital-assets.ts` in @lsp-indexer/next, updated `index.ts` in all 3 packages (@lsp-indexer/node, @lsp-indexer/react, @lsp-indexer/next). All 4 packages build clean.

## Must-Haves

- [ ] 'Developer can import useDigitalAsset, useDigitalAssets, useInfiniteDigitalAssets from @lsp-indexer/react'
- [ ] 'Developer can import useDigitalAsset, useDigitalAssets, useInfiniteDigitalAssets from @lsp-indexer/next'
- [ ] 'Developer can import digitalAssetKeys from @lsp-indexer/node for cache invalidation'
- [ ] 'Developer can import DigitalAsset, DigitalAssetFilter types from @lsp-indexer/types'
- [ ] 'Developer can import getDigitalAsset, getDigitalAssets server actions from @lsp-indexer/next'
- [ ] 'useDigitalAsset returns { digitalAsset, isLoading, error, ...rest }'
- [ ] 'useDigitalAssets returns { digitalAssets, totalCount, isLoading, error, ...rest }'
- [ ] 'useInfiniteDigitalAssets returns { digitalAssets, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }'
- [ ] 'All 4 packages build successfully with pnpm build'

## Files

- `packages/react/src/hooks/digital-assets.ts`
- `packages/react/src/index.ts`
- `packages/next/src/actions/digital-assets.ts`
- `packages/next/src/hooks/digital-assets.ts`
- `packages/next/src/index.ts`
- `packages/node/src/index.ts`
