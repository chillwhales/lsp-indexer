import type { InfiniteData, UseInfiniteQueryResult, UseQueryResult } from '@tanstack/react-query';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { FetchDigitalAssetsResult } from '@lsp-indexer/node';
import { digitalAssetKeys } from '@lsp-indexer/node';
import type {
  DigitalAsset,
  DigitalAssetInclude,
  DigitalAssetResult,
  PartialDigitalAsset,
  UseDigitalAssetParams,
  UseDigitalAssetsParams,
  UseInfiniteDigitalAssetsParams,
} from '@lsp-indexer/types';

import { getDigitalAsset, getDigitalAssets } from '../actions/digital-assets';

/** Default number of digital assets per page for infinite scroll queries */
const DEFAULT_PAGE_SIZE = 20;

/** Flat return shape for useDigitalAsset — digitalAsset + query state */
type UseDigitalAssetReturn<F> = { digitalAsset: F | null } & Omit<
  UseQueryResult<F | null, Error>,
  'data'
>;

/** Flat return shape for useDigitalAssets — digitalAssets array + totalCount + query state */
type UseDigitalAssetsReturn<F> = { digitalAssets: F[]; totalCount: number } & Omit<
  UseQueryResult<FetchDigitalAssetsResult<F>, Error>,
  'data'
>;

/** Flat return shape for useInfiniteDigitalAssets — digitalAssets array + infinite scroll controls + query state */
type UseInfiniteDigitalAssetsReturn<F> = {
  digitalAssets: F[];
  hasNextPage: boolean;
  fetchNextPage: UseInfiniteQueryResult['fetchNextPage'];
  isFetchingNextPage: boolean;
} & Omit<
  UseInfiniteQueryResult<InfiniteData<FetchDigitalAssetsResult<F>>, Error>,
  'data' | 'hasNextPage' | 'fetchNextPage' | 'isFetchingNextPage'
>;

/**
 * Fetch a single digital asset by address via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useDigitalAsset`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 * This keeps the GraphQL endpoint hidden from the client.
 *
 * @param params - Digital asset address and optional include config
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
 *       <p>{digitalAsset.symbol}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useDigitalAsset<const I extends DigitalAssetInclude>(
  params: UseDigitalAssetParams & { include: I },
): UseDigitalAssetReturn<DigitalAssetResult<I>>;
export function useDigitalAsset(
  params: Omit<UseDigitalAssetParams, 'include'> & { include?: never },
): UseDigitalAssetReturn<DigitalAsset>;
export function useDigitalAsset(
  params: UseDigitalAssetParams & { include?: DigitalAssetInclude },
): UseDigitalAssetReturn<PartialDigitalAsset>;
export function useDigitalAsset(
  params: UseDigitalAssetParams & { include?: DigitalAssetInclude },
): UseDigitalAssetReturn<PartialDigitalAsset> {
  const { address, include } = params;

  const { data, ...rest } = useQuery({
    queryKey: digitalAssetKeys.detail(address, include),
    queryFn: () => (include ? getDigitalAsset(address, include) : getDigitalAsset(address)),
    enabled: Boolean(address),
  });

  const digitalAsset = data ?? null;
  return { digitalAsset, ...rest };
}

/**
 * Fetch a paginated list of digital assets via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useDigitalAssets`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter, sort, pagination, and include config
 * @returns `{ digitalAssets, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `digitalAssets` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useDigitalAssets } from '@lsp-indexer/next';
 *
 * function AssetList() {
 *   const { digitalAssets, totalCount, isLoading } = useDigitalAssets({
 *     filter: { tokenType: 'TOKEN' },
 *     sort: { field: 'name', direction: 'asc' },
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
export function useDigitalAssets<const I extends DigitalAssetInclude>(
  params: UseDigitalAssetsParams & { include: I },
): UseDigitalAssetsReturn<DigitalAssetResult<I>>;
export function useDigitalAssets(
  params?: Omit<UseDigitalAssetsParams, 'include'> & { include?: never },
): UseDigitalAssetsReturn<DigitalAsset>;
export function useDigitalAssets(
  params: UseDigitalAssetsParams & { include?: DigitalAssetInclude },
): UseDigitalAssetsReturn<PartialDigitalAsset>;
export function useDigitalAssets(
  params: UseDigitalAssetsParams & { include?: DigitalAssetInclude } = {},
): UseDigitalAssetsReturn<PartialDigitalAsset> {
  const { filter, sort, limit, offset, include } = params;

  const { data, ...rest } = useQuery({
    queryKey: digitalAssetKeys.list(filter, sort, limit, offset, include),
    queryFn: () =>
      include
        ? getDigitalAssets({ filter, sort, limit, offset, include })
        : getDigitalAssets({ filter, sort, limit, offset }),
  });

  const digitalAssets = data?.digitalAssets ?? [];
  return { digitalAssets, totalCount: data?.totalCount ?? 0, ...rest };
}

/**
 * Fetch digital assets with infinite scroll pagination via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useInfiniteDigitalAssets`, but routes the
 * request through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter, sort, pageSize, and include config
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
 *     filter: { tokenType: 'NFT' },
 *     sort: { field: 'holderCount', direction: 'desc' },
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
export function useInfiniteDigitalAssets<const I extends DigitalAssetInclude>(
  params: UseInfiniteDigitalAssetsParams & { include: I },
): UseInfiniteDigitalAssetsReturn<DigitalAssetResult<I>>;
export function useInfiniteDigitalAssets(
  params?: Omit<UseInfiniteDigitalAssetsParams, 'include'> & { include?: never },
): UseInfiniteDigitalAssetsReturn<DigitalAsset>;
export function useInfiniteDigitalAssets(
  params: UseInfiniteDigitalAssetsParams & { include?: DigitalAssetInclude },
): UseInfiniteDigitalAssetsReturn<PartialDigitalAsset>;
export function useInfiniteDigitalAssets(
  params: UseInfiniteDigitalAssetsParams & { include?: DigitalAssetInclude } = {},
): UseInfiniteDigitalAssetsReturn<PartialDigitalAsset> {
  const { filter, sort, pageSize = DEFAULT_PAGE_SIZE, include } = params;

  const result = useInfiniteQuery({
    queryKey: digitalAssetKeys.infinite(filter, sort, include),
    queryFn: ({ pageParam }) =>
      include
        ? getDigitalAssets({ filter, sort, limit: pageSize, offset: pageParam, include })
        : getDigitalAssets({ filter, sort, limit: pageSize, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.digitalAssets.length < pageSize) {
        return undefined;
      }
      return lastPageParam + pageSize;
    },
  });

  // Flatten all pages into a single digitalAssets array (memoized to avoid re-flattening on every render)
  // Destructure infinite query properties before rest spread to avoid TS2783 duplicate property errors
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
