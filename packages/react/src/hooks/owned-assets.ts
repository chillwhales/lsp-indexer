import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import {
  fetchOwnedAssets,
  fetchOwnedTokens,
  getClientUrl,
  ownedAssetKeys,
  ownedTokenKeys,
} from '@lsp-indexer/node';
import type {
  UseInfiniteOwnedAssetsParams,
  UseInfiniteOwnedTokensParams,
  UseOwnedAssetsParams,
  UseOwnedTokensParams,
} from '@lsp-indexer/types';

/** Default number of items per page for infinite scroll queries */
const DEFAULT_PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Owned Assets (LSP7 fungible tokens)
// ---------------------------------------------------------------------------

/**
 * Fetch a paginated list of owned assets (LSP7 fungible tokens) with filtering and sorting.
 *
 * Wraps `fetchOwnedAssets` in a TanStack `useQuery` hook. Supports filtering
 * by owner address and asset address, plus sorting by asset address or balance.
 *
 * @param params - Optional filter, sort, and pagination config
 * @returns `{ ownedAssets, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `ownedAssets` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useOwnedAssets } from '@lsp-indexer/react';
 *
 * function AssetList({ ownerAddress }: { ownerAddress: string }) {
 *   const { ownedAssets, totalCount, isLoading } = useOwnedAssets({
 *     filter: { ownerAddress },
 *     limit: 20,
 *   });
 *
 *   return (
 *     <div>
 *       <p>{totalCount} assets found</p>
 *       {ownedAssets.map((a) => (
 *         <div key={`${a.ownerAddress}-${a.assetAddress}`}>{a.name ?? a.assetAddress}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useOwnedAssets(params: UseOwnedAssetsParams = {}) {
  const url = getClientUrl();
  const { filter, sort, limit, offset } = params;

  const { data, ...rest } = useQuery({
    queryKey: ownedAssetKeys.list(filter, sort, limit, offset),
    queryFn: () => fetchOwnedAssets(url, { filter, sort, limit, offset }),
  });

  return {
    ownedAssets: data?.ownedAssets ?? [],
    totalCount: data?.totalCount ?? 0,
    ...rest,
  };
}

/**
 * Fetch owned assets (LSP7 fungible tokens) with infinite scroll pagination.
 *
 * Wraps `fetchOwnedAssets` in a TanStack `useInfiniteQuery` hook with offset-based
 * pagination. Pages are automatically flattened into a single `ownedAssets` array.
 * Uses a **separate query key namespace** from `useOwnedAssets` to prevent cache
 * corruption between standard and infinite query data structures.
 *
 * @param params - Optional filter, sort, and pageSize config
 * @returns `{ ownedAssets, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened owned assets array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteOwnedAssets } from '@lsp-indexer/react';
 *
 * function InfiniteAssetList() {
 *   const {
 *     ownedAssets,
 *     hasNextPage,
 *     fetchNextPage,
 *     isFetchingNextPage,
 *     isLoading,
 *   } = useInfiniteOwnedAssets({
 *     filter: { ownerAddress: '0x...' },
 *     pageSize: 20,
 *   });
 *
 *   return (
 *     <div>
 *       {ownedAssets.map((a) => (
 *         <div key={`${a.ownerAddress}-${a.assetAddress}`}>{a.name ?? a.assetAddress}</div>
 *       ))}
 *       {hasNextPage && (
 *         <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
 *           {isFetchingNextPage ? 'Loading...' : 'Load more'}
 *         </button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useInfiniteOwnedAssets(params: UseInfiniteOwnedAssetsParams = {}) {
  const url = getClientUrl();
  const { filter, sort, pageSize = DEFAULT_PAGE_SIZE } = params;

  const result = useInfiniteQuery({
    queryKey: ownedAssetKeys.infinite(filter, sort),
    queryFn: ({ pageParam }) =>
      fetchOwnedAssets(url, {
        filter,
        sort,
        limit: pageSize,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.ownedAssets.length < pageSize) {
        return undefined;
      }
      return lastPageParam + pageSize;
    },
  });

  // Destructure infinite query properties before rest spread to avoid TS2783
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest } = result;
  const ownedAssets = useMemo(
    () => data?.pages.flatMap((page) => page.ownedAssets) ?? [],
    [data?.pages],
  );

  return {
    ownedAssets,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    ...rest,
  };
}

// ---------------------------------------------------------------------------
// Owned Tokens (LSP8 NFTs with tokenId)
// ---------------------------------------------------------------------------

/**
 * Fetch a paginated list of owned tokens (LSP8 NFTs) with filtering and sorting.
 *
 * Wraps `fetchOwnedTokens` in a TanStack `useQuery` hook. Supports filtering
 * by owner address, asset address, and token ID, plus sorting.
 *
 * @param params - Optional filter, sort, and pagination config
 * @returns `{ ownedTokens, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `ownedTokens` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useOwnedTokens } from '@lsp-indexer/react';
 *
 * function TokenList({ ownerAddress }: { ownerAddress: string }) {
 *   const { ownedTokens, totalCount, isLoading } = useOwnedTokens({
 *     filter: { ownerAddress },
 *     limit: 20,
 *   });
 *
 *   return (
 *     <div>
 *       <p>{totalCount} tokens found</p>
 *       {ownedTokens.map((t) => (
 *         <div key={`${t.ownerAddress}-${t.assetAddress}-${t.tokenId}`}>{t.tokenId}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useOwnedTokens(params: UseOwnedTokensParams = {}) {
  const url = getClientUrl();
  const { filter, sort, limit, offset } = params;

  const { data, ...rest } = useQuery({
    queryKey: ownedTokenKeys.list(filter, sort, limit, offset),
    queryFn: () => fetchOwnedTokens(url, { filter, sort, limit, offset }),
  });

  return {
    ownedTokens: data?.ownedTokens ?? [],
    totalCount: data?.totalCount ?? 0,
    ...rest,
  };
}

/**
 * Fetch owned tokens (LSP8 NFTs) with infinite scroll pagination.
 *
 * Wraps `fetchOwnedTokens` in a TanStack `useInfiniteQuery` hook with offset-based
 * pagination. Pages are automatically flattened into a single `ownedTokens` array.
 * Uses a **separate query key namespace** from `useOwnedTokens` to prevent cache
 * corruption between standard and infinite query data structures.
 *
 * @param params - Optional filter, sort, and pageSize config
 * @returns `{ ownedTokens, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened owned tokens array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteOwnedTokens } from '@lsp-indexer/react';
 *
 * function InfiniteTokenList() {
 *   const {
 *     ownedTokens,
 *     hasNextPage,
 *     fetchNextPage,
 *     isFetchingNextPage,
 *     isLoading,
 *   } = useInfiniteOwnedTokens({
 *     filter: { ownerAddress: '0x...' },
 *     pageSize: 20,
 *   });
 *
 *   return (
 *     <div>
 *       {ownedTokens.map((t) => (
 *         <div key={`${t.ownerAddress}-${t.assetAddress}-${t.tokenId}`}>{t.tokenId}</div>
 *       ))}
 *       {hasNextPage && (
 *         <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
 *           {isFetchingNextPage ? 'Loading...' : 'Load more'}
 *         </button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useInfiniteOwnedTokens(params: UseInfiniteOwnedTokensParams = {}) {
  const url = getClientUrl();
  const { filter, sort, pageSize = DEFAULT_PAGE_SIZE } = params;

  const result = useInfiniteQuery({
    queryKey: ownedTokenKeys.infinite(filter, sort),
    queryFn: ({ pageParam }) =>
      fetchOwnedTokens(url, {
        filter,
        sort,
        limit: pageSize,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.ownedTokens.length < pageSize) {
        return undefined;
      }
      return lastPageParam + pageSize;
    },
  });

  // Destructure infinite query properties before rest spread to avoid TS2783
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest } = result;
  const ownedTokens = useMemo(
    () => data?.pages.flatMap((page) => page.ownedTokens) ?? [],
    [data?.pages],
  );

  return {
    ownedTokens,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    ...rest,
  };
}
