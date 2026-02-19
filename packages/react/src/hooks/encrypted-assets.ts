import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import {
  encryptedAssetKeys,
  fetchEncryptedAsset,
  fetchEncryptedAssets,
  getClientUrl,
} from '@lsp-indexer/node';
import type {
  UseEncryptedAssetParams,
  UseEncryptedAssetsParams,
  UseInfiniteEncryptedAssetsParams,
} from '@lsp-indexer/types';

/** Default number of encrypted assets per page for infinite scroll queries */
const DEFAULT_PAGE_SIZE = 20;

/**
 * Fetch a single LSP29 Encrypted Asset by address.
 *
 * Wraps `fetchEncryptedAsset` in a TanStack `useQuery` hook with automatic caching,
 * deduplication, and stale-while-revalidate. The query is disabled when
 * `address` is falsy (empty string, undefined via type widening, etc.).
 *
 * @param params - Encrypted asset address
 * @returns `{ encryptedAsset, isLoading, error, ...rest }` — full TanStack Query result
 *   with `data` renamed to `encryptedAsset`
 *
 * @example
 * ```tsx
 * import { useEncryptedAsset } from '@lsp-indexer/react';
 *
 * function EncryptedAssetCard({ address }: { address: string }) {
 *   const { encryptedAsset, isLoading, error } = useEncryptedAsset({ address });
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <Alert>{error.message}</Alert>;
 *   if (!encryptedAsset) return <p>Not found</p>;
 *
 *   return <div>{encryptedAsset.title ?? 'Untitled'}</div>;
 * }
 * ```
 */
export function useEncryptedAsset(params: UseEncryptedAssetParams) {
  const url = getClientUrl();
  const { address } = params;

  const { data, ...rest } = useQuery({
    queryKey: encryptedAssetKeys.detail(address),
    queryFn: () => fetchEncryptedAsset(url, { address }),
    enabled: Boolean(address),
  });

  return { encryptedAsset: data ?? null, ...rest };
}

/**
 * Fetch a paginated list of LSP29 Encrypted Assets with filtering and sorting.
 *
 * Wraps `fetchEncryptedAssets` in a TanStack `useQuery` hook. Supports filtering
 * by title and owner address, and sorting by title or timestamp.
 *
 * @param params - Optional filter, sort, and pagination config
 * @returns `{ encryptedAssets, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `encryptedAssets` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useEncryptedAssets } from '@lsp-indexer/react';
 *
 * function EncryptedAssetList() {
 *   const { encryptedAssets, totalCount, isLoading } = useEncryptedAssets({
 *     filter: { title: 'photo' },
 *     sort: { field: 'timestamp', direction: 'desc' },
 *     limit: 20,
 *   });
 *
 *   return (
 *     <div>
 *       <p>{totalCount} assets found</p>
 *       {encryptedAssets.map((a) => <div key={a.id}>{a.title}</div>)}
 *     </div>
 *   );
 * }
 * ```
 */
export function useEncryptedAssets(params: UseEncryptedAssetsParams = {}) {
  const url = getClientUrl();
  const { filter, sort, limit, offset } = params;

  const { data, ...rest } = useQuery({
    queryKey: encryptedAssetKeys.list(filter, sort, limit, offset),
    queryFn: () => fetchEncryptedAssets(url, { filter, sort, limit, offset }),
  });

  return {
    encryptedAssets: data?.encryptedAssets ?? [],
    totalCount: data?.totalCount ?? 0,
    ...rest,
  };
}

/**
 * Fetch LSP29 Encrypted Assets with infinite scroll pagination.
 *
 * Wraps `fetchEncryptedAssets` in a TanStack `useInfiniteQuery` hook with offset-based
 * pagination. Pages are automatically flattened into a single `encryptedAssets` array.
 * Uses a **separate query key namespace** from `useEncryptedAssets` to prevent cache
 * corruption between standard and infinite query data structures.
 *
 * @param params - Optional filter, sort, and pageSize config
 * @returns `{ encryptedAssets, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened encrypted assets array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteEncryptedAssets } from '@lsp-indexer/react';
 *
 * function InfiniteEncryptedAssetList() {
 *   const {
 *     encryptedAssets,
 *     hasNextPage,
 *     fetchNextPage,
 *     isFetchingNextPage,
 *   } = useInfiniteEncryptedAssets({
 *     sort: { field: 'timestamp', direction: 'desc' },
 *     pageSize: 20,
 *   });
 *
 *   return (
 *     <div>
 *       {encryptedAssets.map((a) => <div key={a.id}>{a.title}</div>)}
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
export function useInfiniteEncryptedAssets(params: UseInfiniteEncryptedAssetsParams = {}) {
  const url = getClientUrl();
  const { filter, sort, pageSize = DEFAULT_PAGE_SIZE } = params;

  const result = useInfiniteQuery({
    queryKey: encryptedAssetKeys.infinite(filter, sort),
    queryFn: ({ pageParam }) =>
      fetchEncryptedAssets(url, {
        filter,
        sort,
        limit: pageSize,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      // If the last page returned fewer results than requested, there are no more pages
      if (lastPage.encryptedAssets.length < pageSize) {
        return undefined;
      }
      // Next offset = current offset + page size
      return lastPageParam + pageSize;
    },
  });

  // Destructure infinite query properties before rest spread to avoid TS2783
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest } = result;
  const encryptedAssets = useMemo(
    () => data?.pages.flatMap((page) => page.encryptedAssets) ?? [],
    [data?.pages],
  );

  return {
    encryptedAssets,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    ...rest,
  };
}
