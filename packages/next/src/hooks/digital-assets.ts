import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { digitalAssetKeys } from '@lsp-indexer/node';
import type {
  UseDigitalAssetParams,
  UseDigitalAssetsParams,
  UseInfiniteDigitalAssetsParams,
} from '@lsp-indexer/types';

import { getDigitalAsset, getDigitalAssets } from '../actions/digital-assets';

/** Default number of digital assets per page for infinite scroll queries */
const DEFAULT_PAGE_SIZE = 20;

/**
 * Fetch a single Digital Asset by address via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useDigitalAsset`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 * This keeps the GraphQL endpoint hidden from the client.
 *
 * @param params - Digital asset address
 * @returns `{ digitalAsset, isLoading, error, ...rest }` — full TanStack Query result
 *   with `data` renamed to `digitalAsset`
 *
 * @example
 * ```tsx
 * import { useDigitalAsset } from '@lsp-indexer/next';
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
  const { address } = params;

  const { data, ...rest } = useQuery({
    queryKey: digitalAssetKeys.detail(address),
    queryFn: () => getDigitalAsset(address),
    enabled: Boolean(address),
  });

  return { digitalAsset: data ?? null, ...rest };
}

/**
 * Fetch a paginated list of Digital Assets via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useDigitalAssets`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter, sort, and pagination config
 * @returns `{ digitalAssets, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `digitalAssets` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useDigitalAssets } from '@lsp-indexer/next';
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
  const { filter, sort, limit, offset } = params;

  const { data, ...rest } = useQuery({
    queryKey: digitalAssetKeys.list(filter, sort, limit, offset),
    queryFn: () => getDigitalAssets({ filter, sort, limit, offset }),
  });

  return {
    digitalAssets: data?.digitalAssets ?? [],
    totalCount: data?.totalCount ?? 0,
    ...rest,
  };
}

/**
 * Fetch Digital Assets with infinite scroll pagination via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useInfiniteDigitalAssets`, but routes the
 * request through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter, sort, and pageSize config
 * @returns `{ digitalAssets, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened digital assets array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteDigitalAssets } from '@lsp-indexer/next';
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
  const { filter, sort, pageSize = DEFAULT_PAGE_SIZE } = params;

  const result = useInfiniteQuery({
    queryKey: digitalAssetKeys.infinite(filter, sort),
    queryFn: ({ pageParam }) =>
      getDigitalAssets({
        filter,
        sort,
        limit: pageSize,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.digitalAssets.length < pageSize) {
        return undefined;
      }
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
