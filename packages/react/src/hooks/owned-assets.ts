import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { fetchOwnedAsset, fetchOwnedAssets, getClientUrl, ownedAssetKeys } from '@lsp-indexer/node';
import type {
  UseInfiniteOwnedAssetsParams,
  UseOwnedAssetParams,
  UseOwnedAssetsParams,
} from '@lsp-indexer/types';

/** Default number of owned assets per page for infinite scroll queries */
const DEFAULT_PAGE_SIZE = 20;

/**
 * Fetch a single owned asset by unique ID.
 *
 * Wraps `fetchOwnedAsset` in a TanStack `useQuery` hook with automatic caching,
 * deduplication, and stale-while-revalidate. The query is disabled when
 * `id` is falsy (empty string, undefined via type widening, etc.).
 *
 * @param params - Owned asset ID and optional include config
 * @returns `{ ownedAsset, isLoading, error, ...rest }` — full TanStack Query result
 *   with `data` renamed to `ownedAsset`
 *
 * @example
 * ```tsx
 * import { useOwnedAsset } from '@lsp-indexer/react';
 *
 * function OwnedAssetCard({ id }: { id: string }) {
 *   const { ownedAsset, isLoading, error } = useOwnedAsset({ id });
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <Alert>{error.message}</Alert>;
 *   if (!ownedAsset) return <p>Owned asset not found</p>;
 *
 *   return (
 *     <div>
 *       <h2>{ownedAsset.address}</h2>
 *       <p>Balance: {ownedAsset.balance.toString()}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useOwnedAsset(params: UseOwnedAssetParams) {
  const url = getClientUrl();
  const { id, include } = params;

  const { data, ...rest } = useQuery({
    queryKey: ownedAssetKeys.detail(id, include),
    queryFn: () => fetchOwnedAsset(url, { id, include }),
    enabled: Boolean(id),
  });

  return { ownedAsset: data ?? null, ...rest };
}

/**
 * Fetch a paginated list of owned assets with filtering and sorting.
 *
 * Wraps `fetchOwnedAssets` in a TanStack `useQuery` hook. Supports filtering
 * (by holderAddress, digitalAssetAddress, holderName, assetName) and sorting
 * (by balance, timestamp, digitalAssetAddress, holderAddress, block, digitalAssetName, tokenIdCount).
 *
 * @param params - Optional filter, sort, pagination, and include config
 * @returns `{ ownedAssets, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `ownedAssets` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useOwnedAssets } from '@lsp-indexer/react';
 *
 * function OwnedAssetList({ owner }: { owner: string }) {
 *   const { ownedAssets, totalCount, isLoading } = useOwnedAssets({
 *     filter: { owner },
 *     sort: { field: 'balance', direction: 'desc' },
 *     limit: 20,
 *     offset: 0,
 *   });
 *
 *   return (
 *     <div>
 *       <p>{totalCount} owned assets found</p>
 *       {ownedAssets.map((a) => (
 *         <div key={a.id}>{a.address} — {a.balance.toString()}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useOwnedAssets(params: UseOwnedAssetsParams = {}) {
  const url = getClientUrl();
  const { filter, sort, limit, offset, include } = params;

  const { data, ...rest } = useQuery({
    queryKey: ownedAssetKeys.list(filter, sort, limit, offset, include),
    queryFn: () => fetchOwnedAssets(url, { filter, sort, limit, offset, include }),
  });

  return {
    ownedAssets: data?.ownedAssets ?? [],
    totalCount: data?.totalCount ?? 0,
    ...rest,
  };
}

/**
 * Fetch owned assets with infinite scroll pagination.
 *
 * Wraps `fetchOwnedAssets` in a TanStack `useInfiniteQuery` hook with offset-based
 * pagination. Pages are automatically flattened into a single `ownedAssets` array.
 * Uses a **separate query key namespace** from `useOwnedAssets` to prevent cache
 * corruption between standard and infinite query data structures.
 *
 * @param params - Optional filter, sort, pageSize, and include config
 * @returns `{ ownedAssets, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened owned assets array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteOwnedAssets } from '@lsp-indexer/react';
 *
 * function InfiniteOwnedAssetList({ owner }: { owner: string }) {
 *   const {
 *     ownedAssets,
 *     hasNextPage,
 *     fetchNextPage,
 *     isFetchingNextPage,
 *     isLoading,
 *   } = useInfiniteOwnedAssets({
 *     filter: { owner },
 *     sort: { field: 'balance', direction: 'desc' },
 *     pageSize: 20,
 *   });
 *
 *   return (
 *     <div>
 *       {ownedAssets.map((a) => (
 *         <div key={a.id}>{a.address} — {a.balance.toString()}</div>
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
  const { filter, sort, pageSize = DEFAULT_PAGE_SIZE, include } = params;

  const result = useInfiniteQuery({
    queryKey: ownedAssetKeys.infinite(filter, sort, include),
    queryFn: ({ pageParam }) =>
      fetchOwnedAssets(url, {
        filter,
        sort,
        limit: pageSize,
        offset: pageParam,
        include,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      // If the last page returned fewer results than requested, there are no more pages
      if (lastPage.ownedAssets.length < pageSize) {
        return undefined;
      }
      // Next offset = current offset + page size
      return lastPageParam + pageSize;
    },
  });

  // Flatten all pages into a single ownedAssets array (memoized to avoid re-flattening on every render)
  // Destructure infinite query properties before rest spread to avoid TS2783 duplicate property errors
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
