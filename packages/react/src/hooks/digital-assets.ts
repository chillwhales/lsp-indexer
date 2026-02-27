import type { InfiniteData, UseInfiniteQueryResult, UseQueryResult } from '@tanstack/react-query';
import { useInfiniteQuery, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { FetchDigitalAssetsResult } from '@lsp-indexer/node';
import {
  buildDigitalAssetIncludeVars,
  buildDigitalAssetWhere,
  digitalAssetKeys,
  fetchDigitalAsset,
  fetchDigitalAssets,
  getClientUrl,
  parseDigitalAssets,
  DigitalAssetSubscriptionDocument,
} from '@lsp-indexer/node';
import type {
  DigitalAsset,
  DigitalAssetFilter,
  DigitalAssetInclude,
  DigitalAssetResult,
  PartialDigitalAsset,
  UseDigitalAssetParams,
  UseDigitalAssetsParams,
  UseInfiniteDigitalAssetsParams,
} from '@lsp-indexer/types';

import { useSubscription } from '../subscriptions/use-subscription';
import type { UseSubscriptionReturn } from '../subscriptions/use-subscription';

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
 * Fetch a single digital asset by address.
 *
 * Wraps `fetchDigitalAsset` in a TanStack `useQuery` hook with automatic caching,
 * deduplication, and stale-while-revalidate. The query is disabled when
 * `address` is falsy (empty string, undefined via type widening, etc.).
 *
 * @param params - Digital asset address and optional include config
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
  const url = getClientUrl();
  const { address, include } = params;

  const { data, ...rest } = useQuery({
    queryKey: digitalAssetKeys.detail(address, include),
    queryFn: () =>
      include ? fetchDigitalAsset(url, { address, include }) : fetchDigitalAsset(url, { address }),
    enabled: Boolean(address),
  });

  const digitalAsset = data ?? null;
  return { digitalAsset, ...rest };
}

/**
 * Fetch a paginated list of digital assets with filtering and sorting.
 *
 * Wraps `fetchDigitalAssets` in a TanStack `useQuery` hook. Supports comprehensive
 * filtering (by name, symbol, tokenType, category, holderAddress, ownerAddress) and
 * sorting (by name, symbol, holderCount, creatorCount, totalSupply, createdAt).
 *
 * @param params - Optional filter, sort, pagination, and include config
 * @returns `{ digitalAssets, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `digitalAssets` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useDigitalAssets } from '@lsp-indexer/react';
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
  const url = getClientUrl();
  const { filter, sort, limit, offset, include } = params;

  const { data, ...rest } = useQuery({
    queryKey: digitalAssetKeys.list(filter, sort, limit, offset, include),
    queryFn: () =>
      include
        ? fetchDigitalAssets(url, { filter, sort, limit, offset, include })
        : fetchDigitalAssets(url, { filter, sort, limit, offset }),
  });

  const digitalAssets = data?.digitalAssets ?? [];
  return { digitalAssets, totalCount: data?.totalCount ?? 0, ...rest };
}

/**
 * Fetch digital assets with infinite scroll pagination.
 *
 * Wraps `fetchDigitalAssets` in a TanStack `useInfiniteQuery` hook with offset-based
 * pagination. Pages are automatically flattened into a single `digitalAssets` array.
 * Uses a **separate query key namespace** from `useDigitalAssets` to prevent cache
 * corruption between standard and infinite query data structures.
 *
 * @param params - Optional filter, sort, pageSize, and include config
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
  const url = getClientUrl();
  const { filter, sort, pageSize = DEFAULT_PAGE_SIZE, include } = params;

  const result = useInfiniteQuery({
    queryKey: digitalAssetKeys.infinite(filter, sort, include),
    queryFn: ({ pageParam }) =>
      include
        ? fetchDigitalAssets(url, {
            filter,
            sort,
            limit: pageSize,
            offset: pageParam,
            include,
          })
        : fetchDigitalAssets(url, {
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

// ---------------------------------------------------------------------------
// Subscription hook
// ---------------------------------------------------------------------------

const DEFAULT_SUBSCRIPTION_LIMIT = 10;

interface UseDigitalAssetSubscriptionParams {
  /** Filter criteria to narrow which digital assets to subscribe to */
  filter?: DigitalAssetFilter;
  /** Control which nested fields are included in subscription data */
  include?: DigitalAssetInclude;
  /** Maximum number of results per subscription update (default: 10) */
  limit?: number;
  /** Whether the subscription is active (default: true) */
  enabled?: boolean;
  /** Whether to invalidate TanStack Query cache on subscription data (default: false) */
  invalidate?: boolean;
  /** Callback fired when new subscription data arrives */
  onData?: (data: DigitalAsset[]) => void;
  /** Callback fired when the WebSocket reconnects after a disconnect */
  onReconnect?: () => void;
}

/**
 * Subscribe to real-time digital asset updates via WebSocket.
 *
 * Wraps the generic `useSubscription` hook with digital-asset-specific document,
 * parser, and filter/include logic. Mirrors `useDigitalAssets` query behavior
 * but receives live updates instead of polling.
 *
 * @param params - Optional filter, include, limit, and callback config
 * @returns `{ data, isConnected, isSubscribed, error }` — subscription state
 *
 * @example
 * ```tsx
 * import { useDigitalAssetSubscription } from '@lsp-indexer/react';
 *
 * function LiveAssets() {
 *   const { data: assets, isConnected } = useDigitalAssetSubscription({
 *     filter: { tokenType: 'TOKEN' },
 *     limit: 5,
 *   });
 *
 *   return (
 *     <div>
 *       <span>{isConnected ? '🟢' : '🔴'}</span>
 *       {assets?.map((a) => <div key={a.address}>{a.name}</div>)}
 *     </div>
 *   );
 * }
 * ```
 */
export function useDigitalAssetSubscription(
  params: UseDigitalAssetSubscriptionParams = {},
): UseSubscriptionReturn<DigitalAsset> {
  const {
    filter,
    include,
    limit = DEFAULT_SUBSCRIPTION_LIMIT,
    enabled = true,
    invalidate = false,
    onData,
    onReconnect,
  } = params;

  const where = buildDigitalAssetWhere(filter);
  const includeVars = buildDigitalAssetIncludeVars(include);

  let queryClient: QueryClient | undefined;
  try {
    queryClient = useQueryClient();
  } catch {
    // No QueryClientProvider — cache invalidation won't work but hook still functions
  }

  return useSubscription({
    document: DigitalAssetSubscriptionDocument,
    dataKey: 'digital_asset',
    variables: {
      where: Object.keys(where).length > 0 ? where : undefined,
      order_by: undefined,
      limit,
      ...includeVars,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parser: (raw: any[]) => parseDigitalAssets(raw),
    enabled,
    invalidate,
    invalidateKeys: invalidate ? [digitalAssetKeys.all] : undefined,
    queryClient: invalidate ? queryClient : undefined,
    onData,
    onReconnect,
  });
}
