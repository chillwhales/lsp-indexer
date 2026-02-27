'use client';

import type { InfiniteData, UseInfiniteQueryResult, UseQueryResult } from '@tanstack/react-query';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { FetchIssuedAssetsResult } from '@lsp-indexer/node';
import { issuedAssetKeys } from '@lsp-indexer/node';
import type {
  IssuedAsset,
  IssuedAssetInclude,
  IssuedAssetResult,
  PartialIssuedAsset,
  UseInfiniteIssuedAssetsParams,
  UseIssuedAssetsParams,
} from '@lsp-indexer/types';

import { getIssuedAssets } from '../actions/issued-assets';

/** Default number of issued assets per page for infinite scroll queries */
const DEFAULT_PAGE_SIZE = 20;

/** Flat return shape for useIssuedAssets — issuedAssets array + totalCount + query state */
type UseIssuedAssetsReturn<F> = { issuedAssets: F[]; totalCount: number } & Omit<
  UseQueryResult<FetchIssuedAssetsResult<F>, Error>,
  'data'
>;

/** Flat return shape for useInfiniteIssuedAssets — issuedAssets array + infinite scroll controls + query state */
type UseInfiniteIssuedAssetsReturn<F> = {
  issuedAssets: F[];
  hasNextPage: boolean;
  fetchNextPage: UseInfiniteQueryResult['fetchNextPage'];
  isFetchingNextPage: boolean;
} & Omit<
  UseInfiniteQueryResult<InfiniteData<FetchIssuedAssetsResult<F>>, Error>,
  'data' | 'hasNextPage' | 'fetchNextPage' | 'isFetchingNextPage'
>;

/**
 * Fetch a paginated list of LSP12 issued asset records via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useIssuedAssets`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 * This keeps the GraphQL endpoint hidden from the client.
 *
 * @param params - Optional filter/sort/pagination/include
 * @returns `{ issuedAssets, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `issuedAssets` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useIssuedAssets } from '@lsp-indexer/next';
 *
 * function IssuedAssetList({ address }: { address: string }) {
 *   const { issuedAssets, totalCount, isLoading } = useIssuedAssets({
 *     filter: { issuerAddress: address },
 *     sort: { field: 'timestamp', direction: 'desc' },
 *     limit: 20,
 *   });
 *
 *   return (
 *     <div>
 *       <p>{totalCount} issued assets</p>
 *       {issuedAssets.map((ia) => (
 *         <div key={`${ia.issuerAddress}-${ia.assetAddress}`}>
 *           {ia.assetAddress}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useIssuedAssets<const I extends IssuedAssetInclude>(
  params: UseIssuedAssetsParams & { include: I },
): UseIssuedAssetsReturn<IssuedAssetResult<I>>;
export function useIssuedAssets(
  params?: Omit<UseIssuedAssetsParams, 'include'> & { include?: never },
): UseIssuedAssetsReturn<IssuedAsset>;
export function useIssuedAssets(
  params: UseIssuedAssetsParams & { include?: IssuedAssetInclude },
): UseIssuedAssetsReturn<PartialIssuedAsset>;
export function useIssuedAssets(
  params: UseIssuedAssetsParams & { include?: IssuedAssetInclude } = {},
): UseIssuedAssetsReturn<PartialIssuedAsset> {
  const { filter, sort, limit, offset, include } = params;

  const { data, ...rest } = useQuery({
    queryKey: issuedAssetKeys.list(filter, sort, limit, offset, include),
    queryFn: () =>
      include
        ? getIssuedAssets({ filter, sort, limit, offset, include })
        : getIssuedAssets({ filter, sort, limit, offset }),
  });

  const issuedAssets = data?.issuedAssets ?? [];
  return { issuedAssets, totalCount: data?.totalCount ?? 0, ...rest };
}

/**
 * Fetch LSP12 issued asset records with infinite scroll pagination via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useInfiniteIssuedAssets`, but routes the
 * request through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter/sort/pageSize/include
 * @returns `{ issuedAssets, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened issuedAssets array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteIssuedAssets } from '@lsp-indexer/next';
 *
 * function InfiniteIssuedAssetList({ address }: { address: string }) {
 *   const {
 *     issuedAssets,
 *     hasNextPage,
 *     fetchNextPage,
 *     isFetchingNextPage,
 *   } = useInfiniteIssuedAssets({
 *     filter: { issuerAddress: address },
 *   });
 *
 *   return (
 *     <div>
 *       {issuedAssets.map((ia) => (
 *         <div key={`${ia.issuerAddress}-${ia.assetAddress}`}>
 *           {ia.assetAddress}
 *         </div>
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
export function useInfiniteIssuedAssets<const I extends IssuedAssetInclude>(
  params: UseInfiniteIssuedAssetsParams & { include: I },
): UseInfiniteIssuedAssetsReturn<IssuedAssetResult<I>>;
export function useInfiniteIssuedAssets(
  params?: Omit<UseInfiniteIssuedAssetsParams, 'include'> & { include?: never },
): UseInfiniteIssuedAssetsReturn<IssuedAsset>;
export function useInfiniteIssuedAssets(
  params: UseInfiniteIssuedAssetsParams & { include?: IssuedAssetInclude },
): UseInfiniteIssuedAssetsReturn<PartialIssuedAsset>;
export function useInfiniteIssuedAssets(
  params: UseInfiniteIssuedAssetsParams & { include?: IssuedAssetInclude } = {},
): UseInfiniteIssuedAssetsReturn<PartialIssuedAsset> {
  const { filter, sort, pageSize = DEFAULT_PAGE_SIZE, include } = params;

  const result = useInfiniteQuery({
    queryKey: issuedAssetKeys.infinite(filter, sort, include),
    queryFn: ({ pageParam }) =>
      include
        ? getIssuedAssets({
            filter,
            sort,
            limit: pageSize,
            offset: pageParam,
            include,
          })
        : getIssuedAssets({
            filter,
            sort,
            limit: pageSize,
            offset: pageParam,
          }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.issuedAssets.length < pageSize) {
        return undefined;
      }
      return lastPageParam + pageSize;
    },
  });

  // Flatten all pages into a single issuedAssets array (memoized to avoid re-flattening on every render)
  // Destructure infinite query properties before rest spread to avoid TS2783 duplicate property errors
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest } = result;
  const issuedAssets = useMemo(
    () => data?.pages.flatMap((page) => page.issuedAssets) ?? [],
    [data?.pages],
  );

  return {
    issuedAssets,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    ...rest,
  };
}
