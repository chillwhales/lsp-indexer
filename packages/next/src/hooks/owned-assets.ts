import type { InfiniteData, UseInfiniteQueryResult, UseQueryResult } from '@tanstack/react-query';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { FetchOwnedAssetsResult } from '@lsp-indexer/node';
import { ownedAssetKeys } from '@lsp-indexer/node';
import type {
  OwnedAsset,
  OwnedAssetInclude,
  OwnedAssetResult,
  PartialOwnedAsset,
  UseInfiniteOwnedAssetsParams,
  UseOwnedAssetParams,
  UseOwnedAssetsParams,
} from '@lsp-indexer/types';

import { getOwnedAsset, getOwnedAssets } from '../actions/owned-assets';

/** Default number of owned assets per page for infinite scroll queries */
const DEFAULT_PAGE_SIZE = 20;

/** Flat return shape for useOwnedAsset — ownedAsset + query state */
type UseOwnedAssetReturn<F> = { ownedAsset: F | null } & Omit<
  UseQueryResult<F | null, Error>,
  'data'
>;

/** Flat return shape for useOwnedAssets — ownedAssets array + totalCount + query state */
type UseOwnedAssetsReturn<F> = { ownedAssets: F[]; totalCount: number } & Omit<
  UseQueryResult<FetchOwnedAssetsResult<F>, Error>,
  'data'
>;

/** Flat return shape for useInfiniteOwnedAssets — ownedAssets array + infinite scroll controls + query state */
type UseInfiniteOwnedAssetsReturn<F> = {
  ownedAssets: F[];
  hasNextPage: boolean;
  fetchNextPage: UseInfiniteQueryResult['fetchNextPage'];
  isFetchingNextPage: boolean;
} & Omit<
  UseInfiniteQueryResult<InfiniteData<FetchOwnedAssetsResult<F>>, Error>,
  'data' | 'hasNextPage' | 'fetchNextPage' | 'isFetchingNextPage'
>;

/**
 * Fetch a single owned asset by unique ID via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useOwnedAsset`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 * This keeps the GraphQL endpoint hidden from the client.
 *
 * @param params - Owned asset ID and optional include config
 * @returns `{ ownedAsset, isLoading, error, ...rest }` — full TanStack Query result
 *   with `data` renamed to `ownedAsset`
 *
 * @example
 * ```tsx
 * import { useOwnedAsset } from '@lsp-indexer/next';
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
export function useOwnedAsset<const I extends OwnedAssetInclude>(
  params: UseOwnedAssetParams & { include: I },
): UseOwnedAssetReturn<OwnedAssetResult<I>>;
export function useOwnedAsset(
  params: Omit<UseOwnedAssetParams, 'include'> & { include?: never },
): UseOwnedAssetReturn<OwnedAsset>;
export function useOwnedAsset(
  params: UseOwnedAssetParams & { include?: OwnedAssetInclude },
): UseOwnedAssetReturn<PartialOwnedAsset>;
export function useOwnedAsset(
  params: UseOwnedAssetParams & { include?: OwnedAssetInclude },
): UseOwnedAssetReturn<PartialOwnedAsset> {
  const { id, include } = params;

  const { data, ...rest } = useQuery({
    queryKey: ownedAssetKeys.detail(id, include),
    queryFn: () => (include ? getOwnedAsset(id, include) : getOwnedAsset(id)),
    enabled: Boolean(id),
  });

  const ownedAsset = data ?? null;
  return { ownedAsset, ...rest };
}

/**
 * Fetch a paginated list of owned assets via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useOwnedAssets`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter, sort, pagination, and include config
 * @returns `{ ownedAssets, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `ownedAssets` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useOwnedAssets } from '@lsp-indexer/next';
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
export function useOwnedAssets<const I extends OwnedAssetInclude>(
  params: UseOwnedAssetsParams & { include: I },
): UseOwnedAssetsReturn<OwnedAssetResult<I>>;
export function useOwnedAssets(
  params?: Omit<UseOwnedAssetsParams, 'include'> & { include?: never },
): UseOwnedAssetsReturn<OwnedAsset>;
export function useOwnedAssets(
  params: UseOwnedAssetsParams & { include?: OwnedAssetInclude },
): UseOwnedAssetsReturn<PartialOwnedAsset>;
export function useOwnedAssets(
  params: UseOwnedAssetsParams & { include?: OwnedAssetInclude } = {},
): UseOwnedAssetsReturn<PartialOwnedAsset> {
  const { filter, sort, limit, offset, include } = params;

  const { data, ...rest } = useQuery({
    queryKey: ownedAssetKeys.list(filter, sort, limit, offset, include),
    queryFn: () =>
      include
        ? getOwnedAssets({ filter, sort, limit, offset, include })
        : getOwnedAssets({ filter, sort, limit, offset }),
  });

  const ownedAssets = data?.ownedAssets ?? [];
  return { ownedAssets, totalCount: data?.totalCount ?? 0, ...rest };
}

/**
 * Fetch owned assets with infinite scroll pagination via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useInfiniteOwnedAssets`, but routes the
 * request through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter, sort, pageSize, and include config
 * @returns `{ ownedAssets, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened owned assets array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteOwnedAssets } from '@lsp-indexer/next';
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
export function useInfiniteOwnedAssets<const I extends OwnedAssetInclude>(
  params: UseInfiniteOwnedAssetsParams & { include: I },
): UseInfiniteOwnedAssetsReturn<OwnedAssetResult<I>>;
export function useInfiniteOwnedAssets(
  params?: Omit<UseInfiniteOwnedAssetsParams, 'include'> & { include?: never },
): UseInfiniteOwnedAssetsReturn<OwnedAsset>;
export function useInfiniteOwnedAssets(
  params: UseInfiniteOwnedAssetsParams & { include?: OwnedAssetInclude },
): UseInfiniteOwnedAssetsReturn<PartialOwnedAsset>;
export function useInfiniteOwnedAssets(
  params: UseInfiniteOwnedAssetsParams & { include?: OwnedAssetInclude } = {},
): UseInfiniteOwnedAssetsReturn<PartialOwnedAsset> {
  const { filter, sort, pageSize = DEFAULT_PAGE_SIZE, include } = params;

  const result = useInfiniteQuery({
    queryKey: ownedAssetKeys.infinite(filter, sort, include),
    queryFn: ({ pageParam }) =>
      include
        ? getOwnedAssets({ filter, sort, limit: pageSize, offset: pageParam, include })
        : getOwnedAssets({ filter, sort, limit: pageSize, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.ownedAssets.length < pageSize) {
        return undefined;
      }
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
