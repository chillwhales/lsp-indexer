import type { InfiniteData, UseInfiniteQueryResult, UseQueryResult } from '@tanstack/react-query';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { FetchOwnedAssetsResult } from '@lsp-indexer/node';
import {
  buildOwnedAssetIncludeVars,
  buildOwnedAssetWhere,
  fetchOwnedAsset,
  fetchOwnedAssets,
  getClientUrl,
  ownedAssetKeys,
  OwnedAssetSubscriptionDocument,
  parseOwnedAssets,
} from '@lsp-indexer/node';
import type {
  OwnedAsset,
  OwnedAssetFilter,
  OwnedAssetInclude,
  OwnedAssetResult,
  PartialOwnedAsset,
  UseInfiniteOwnedAssetsParams,
  UseOwnedAssetParams,
  UseOwnedAssetsParams,
} from '@lsp-indexer/types';

import type { UseSubscriptionReturn } from '../subscriptions/use-subscription';
import { useSubscription } from '../subscriptions/use-subscription';

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
  const url = getClientUrl();
  const { id, include } = params;

  const { data, ...rest } = useQuery({
    queryKey: ownedAssetKeys.detail(id, include),
    queryFn: () => (include ? fetchOwnedAsset(url, { id, include }) : fetchOwnedAsset(url, { id })),
    enabled: Boolean(id),
  });

  const ownedAsset = data ?? null;
  return { ownedAsset, ...rest };
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
  const url = getClientUrl();
  const { filter, sort, limit, offset, include } = params;

  const { data, ...rest } = useQuery({
    queryKey: ownedAssetKeys.list(filter, sort, limit, offset, include),
    queryFn: () =>
      include
        ? fetchOwnedAssets(url, { filter, sort, limit, offset, include })
        : fetchOwnedAssets(url, { filter, sort, limit, offset }),
  });

  const ownedAssets = data?.ownedAssets ?? [];
  return { ownedAssets, totalCount: data?.totalCount ?? 0, ...rest };
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
  const url = getClientUrl();
  const { filter, sort, pageSize = DEFAULT_PAGE_SIZE, include } = params;

  const result = useInfiniteQuery({
    queryKey: ownedAssetKeys.infinite(filter, sort, include),
    queryFn: ({ pageParam }) =>
      include
        ? fetchOwnedAssets(url, {
            filter,
            sort,
            limit: pageSize,
            offset: pageParam,
            include,
          })
        : fetchOwnedAssets(url, {
            filter,
            sort,
            limit: pageSize,
            offset: pageParam,
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
// ---------------------------------------------------------------------------
// Subscription hook
// ---------------------------------------------------------------------------

/** Default limit for owned asset subscriptions */
const DEFAULT_SUBSCRIPTION_LIMIT = 10;

/** Options for `useOwnedAssetSubscription` */
export interface UseOwnedAssetSubscriptionParams {
  /** Filter conditions (translated to Hasura `where` via `buildOwnedAssetWhere`) */
  filter?: OwnedAssetFilter;
  /** Include configuration for nested fields */
  include?: OwnedAssetInclude;
  /** Maximum number of owned assets to receive (default: 10) */
  limit?: number;
  /** Enable/disable the subscription (default: true) */
  enabled?: boolean;
  /** Whether to invalidate TanStack Query cache on data (default: false) */
  invalidate?: boolean;
  /** Callback when new data arrives */
  onData?: (data: OwnedAsset[]) => void;
  /** Callback on WebSocket reconnect */
  onReconnect?: () => void;
}

/**
 * Subscribe to real-time owned asset updates via WebSocket.
 *
 * Wraps the generic `useSubscription` hook with owned-asset-specific document,
 * parser, and variable builders. Optionally invalidates TanStack Query
 * caches when new data arrives.
 *
 * @param params - Subscription parameters (filter, include, limit, callbacks)
 * @returns `{ data, isConnected, isSubscribed, error }` — subscription state
 *
 * @example
 * ```tsx
 * import { useOwnedAssetSubscription } from '@lsp-indexer/react';
 *
 * function LiveOwnedAssets({ owner }: { owner: string }) {
 *   const { data: ownedAssets, isConnected } = useOwnedAssetSubscription({
 *     filter: { holderAddress: owner },
 *     limit: 20,
 *   });
 *
 *   if (!ownedAssets) return <p>Waiting for data…</p>;
 *   return (
 *     <ul>
 *       {ownedAssets.map((a) => (
 *         <li key={a.id}>{a.address} — {a.balance?.toString()}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useOwnedAssetSubscription(
  params: UseOwnedAssetSubscriptionParams = {},
): UseSubscriptionReturn<OwnedAsset> {
  const {
    filter,
    include,
    limit = DEFAULT_SUBSCRIPTION_LIMIT,
    enabled,
    invalidate,
    onData,
    onReconnect,
  } = params;

  // Try to get QueryClient — may not be available if no QueryClientProvider wraps the tree
  let queryClient: ReturnType<typeof useQueryClient> | undefined;
  try {
    queryClient = useQueryClient();
  } catch {
    // No QueryClientProvider — cache invalidation will be skipped
  }

  const where = buildOwnedAssetWhere(filter);
  const includeVars = buildOwnedAssetIncludeVars(include as never);

  return useSubscription({
    document: OwnedAssetSubscriptionDocument,
    dataKey: "owned_asset",
    variables: {
      where: Object.keys(where).length > 0 ? where : undefined,
      limit,
      ...includeVars,
    },
    parser: (raw: any[]) => parseOwnedAssets(raw),
    enabled,
    invalidate,
    invalidateKeys: [ownedAssetKeys.all],
    onData,
    onReconnect,
    queryClient,
  });
}
