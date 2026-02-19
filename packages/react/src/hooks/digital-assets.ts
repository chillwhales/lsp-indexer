import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import {
  digitalAssetKeys,
  fetchDigitalAsset,
  fetchDigitalAssets,
  getClientUrl,
} from '@lsp-indexer/node';
import type {
  UseDigitalAssetParams,
  UseDigitalAssetsParams,
  UseInfiniteDigitalAssetsParams,
} from '@lsp-indexer/types';

/** Default number of digital assets per page for infinite scroll queries */
const DEFAULT_PAGE_SIZE = 20;

/**
 * Fetch a single Digital Asset by address.
 *
 * Wraps `fetchDigitalAsset` in a TanStack `useQuery` hook with automatic caching,
 * deduplication, and stale-while-revalidate. The query is disabled when
 * `address` is falsy (empty string, undefined via type widening, etc.).
 *
 * @param params - Digital asset address
 * @returns `{ digitalAsset, isLoading, error, ...rest }` — full TanStack Query result
 *   with `data` renamed to `digitalAsset`
 *
 * @example
 * ```tsx
 * import { useDigitalAsset } from '@lsp-indexer/react';
 *
 * function AssetCard({ address }: { address: string }) {
 *   const { digitalAsset, isLoading, error } = useDigitalAsset({ address });
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <Alert>{error.message}</Alert>;
 *   if (!digitalAsset) return <p>Asset not found</p>;
 *
 *   return (
 *     <div>
 *       <h2>{digitalAsset.name ?? 'Unnamed'}</h2>
 *       <p>{digitalAsset.holderCount} holders</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useDigitalAsset(params: UseDigitalAssetParams) {
  const url = getClientUrl();
  const { address } = params;

  const { data, ...rest } = useQuery({
    queryKey: digitalAssetKeys.detail(address),
    queryFn: () => fetchDigitalAsset(url, { address }),
    enabled: Boolean(address),
  });

  return { digitalAsset: data ?? null, ...rest };
}

/**
 * Fetch a paginated list of Digital Assets with filtering and sorting.
 *
 * Wraps `fetchDigitalAssets` in a TanStack `useQuery` hook. Supports comprehensive
 * filtering (by name, symbol, tokenType, creatorAddress) and sorting
 * (by name, symbol, holderCount, creatorCount).
 *
 * Name/symbol search is just `params.filter.name` / `params.filter.symbol` —
 * no separate search hook (same pattern as `useProfiles({ filter: { name } })`).
 *
 * @param params - Optional filter, sort, and pagination config
 * @returns `{ digitalAssets, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `digitalAssets` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useDigitalAssets } from '@lsp-indexer/react';
 *
 * function AssetList() {
 *   const { digitalAssets, totalCount, isLoading } = useDigitalAssets({
 *     filter: { name: 'chill', tokenType: '0' },
 *     sort: { field: 'holderCount', direction: 'desc' },
 *     limit: 20,
 *     offset: 0,
 *   });
 *
 *   return (
 *     <div>
 *       <p>{totalCount} assets found</p>
 *       {digitalAssets.map((a) => (
 *         <div key={a.address}>{a.name}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useDigitalAssets(params: UseDigitalAssetsParams = {}) {
  const url = getClientUrl();
  const { filter, sort, limit, offset } = params;

  const { data, ...rest } = useQuery({
    queryKey: digitalAssetKeys.list(filter, sort, limit, offset),
    queryFn: () => fetchDigitalAssets(url, { filter, sort, limit, offset }),
  });

  return {
    digitalAssets: data?.digitalAssets ?? [],
    totalCount: data?.totalCount ?? 0,
    ...rest,
  };
}

/**
 * Fetch Digital Assets with infinite scroll pagination.
 *
 * Wraps `fetchDigitalAssets` in a TanStack `useInfiniteQuery` hook with offset-based
 * pagination. Pages are automatically flattened into a single `digitalAssets` array.
 * Uses a **separate query key namespace** from `useDigitalAssets` to prevent cache
 * corruption between standard and infinite query data structures.
 *
 * @param params - Optional filter, sort, and pageSize config
 * @returns `{ digitalAssets, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened digital assets array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteDigitalAssets } from '@lsp-indexer/react';
 *
 * function InfiniteAssetList() {
 *   const {
 *     digitalAssets,
 *     hasNextPage,
 *     fetchNextPage,
 *     isFetchingNextPage,
 *     isLoading,
 *   } = useInfiniteDigitalAssets({
 *     filter: { tokenType: '1' },
 *     sort: { field: 'name', direction: 'asc' },
 *     pageSize: 20,
 *   });
 *
 *   return (
 *     <div>
 *       {digitalAssets.map((a) => (
 *         <div key={a.address}>{a.name}</div>
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
export function useInfiniteDigitalAssets(params: UseInfiniteDigitalAssetsParams = {}) {
  const url = getClientUrl();
  const { filter, sort, pageSize = DEFAULT_PAGE_SIZE } = params;

  const result = useInfiniteQuery({
    queryKey: digitalAssetKeys.infinite(filter, sort),
    queryFn: ({ pageParam }) =>
      fetchDigitalAssets(url, {
        filter,
        sort,
        limit: pageSize,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      // If the last page returned fewer results than requested, there are no more pages
      if (lastPage.digitalAssets.length < pageSize) {
        return undefined;
      }
      // Next offset = current offset + page size
      return lastPageParam + pageSize;
    },
  });

  // Flatten all pages into a single digitalAssets array (memoized to avoid re-flattening on every render)
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest } = result;
  const digitalAssets = useMemo(
    () => data?.pages.flatMap((page) => page.digitalAssets) ?? [],
    [data?.pages],
  );

  return {
    digitalAssets,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    ...rest,
  };
}
