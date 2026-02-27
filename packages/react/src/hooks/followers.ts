import type {
  InfiniteData,
  QueryClient,
  UseInfiniteQueryResult,
  UseQueryResult,
} from "@tanstack/react-query";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo } from "react";

import type { FetchFollowsResult } from "@lsp-indexer/node";
import {
  buildFollowerWhere,
  buildFollowerIncludeVars,
  fetchFollowCount,
  fetchFollows,
  fetchIsFollowing,
  FollowerSubscriptionDocument,
  followerKeys,
  getClientUrl,
  parseFollowers,
} from "@lsp-indexer/node";
import type {
  Follower,
  FollowerFilter,
  FollowerInclude,
  FollowerResult,
  PartialFollower,
  UseFollowCountParams,
  UseFollowsParams,
  UseInfiniteFollowsParams,
  UseIsFollowingParams,
} from "@lsp-indexer/types";

import type { UseSubscriptionReturn } from "../subscriptions/use-subscription";
import { useSubscription } from "../subscriptions/use-subscription";

/** Default number of follows per page for infinite scroll queries */
const DEFAULT_PAGE_SIZE = 20;

/** Flat return shape for useFollows — follows array + totalCount + query state */
type UseFollowsReturn<F> = { follows: F[]; totalCount: number } & Omit<
  UseQueryResult<FetchFollowsResult<F>, Error>,
  "data"
>;

/** Flat return shape for useInfiniteFollows — follows array + infinite scroll controls + query state */
type UseInfiniteFollowsReturn<F> = {
  follows: F[];
  hasNextPage: boolean;
  fetchNextPage: UseInfiniteQueryResult["fetchNextPage"];
  isFetchingNextPage: boolean;
} & Omit<
  UseInfiniteQueryResult<InfiniteData<FetchFollowsResult<F>>, Error>,
  "data" | "hasNextPage" | "fetchNextPage" | "isFetchingNextPage"
>;

/**
 * Fetch a paginated list of follow relationships.
 *
 * Wraps `fetchFollows` in a TanStack `useQuery` hook. Consumers scope results
 * via filter fields:
 * - "who follows X?" -> `filter: { followedAddress: X }`
 * - "who does X follow?" -> `filter: { followerAddress: X }`
 *
 * Supports filtering, sorting, pagination, and optional include for field
 * narrowing (DX-04).
 *
 * @param params - Optional filter/sort/pagination/include
 * @returns `{ follows, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `follows` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useFollows } from '@lsp-indexer/react';
 *
 * function FollowerList({ address }: { address: string }) {
 *   const { follows, totalCount, isLoading } = useFollows({
 *     filter: { followedAddress: address },
 *     sort: { field: 'timestamp', direction: 'desc' },
 *     limit: 20,
 *   });
 *
 *   return (
 *     <div>
 *       <p>{totalCount} followers</p>
 *       {follows.map((f) => (
 *         <div key={f.followerAddress}>{f.followerAddress}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFollows<const I extends FollowerInclude>(
  params: UseFollowsParams & { include: I },
): UseFollowsReturn<FollowerResult<I>>;
export function useFollows(
  params: Omit<UseFollowsParams, "include"> & { include?: never },
): UseFollowsReturn<Follower>;
export function useFollows(
  params: UseFollowsParams & { include?: FollowerInclude },
): UseFollowsReturn<PartialFollower>;
export function useFollows(
  params: UseFollowsParams & { include?: FollowerInclude },
): UseFollowsReturn<PartialFollower> {
  const url = getClientUrl();
  const { filter, sort, limit, offset, include } = params;

  const { data, ...rest } = useQuery({
    queryKey: followerKeys.list(filter, sort, limit, offset, include),
    queryFn: () =>
      include
        ? fetchFollows(url, { filter, sort, limit, offset, include })
        : fetchFollows(url, { filter, sort, limit, offset }),
  });

  const follows = data?.follows ?? [];
  return {
    follows,
    totalCount: data?.totalCount ?? 0,
    ...rest,
  };
}

/**
 * Fetch follow relationships with infinite scroll pagination.
 *
 * Wraps `fetchFollows` in a TanStack `useInfiniteQuery` hook with offset-based
 * pagination. Pages are automatically flattened into a single `follows` array.
 * Uses a **separate query key namespace** from `useFollows` to prevent cache
 * corruption between standard and infinite query data structures.
 *
 * @param params - Optional filter/sort/pageSize/include
 * @returns `{ follows, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened follows array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteFollows } from '@lsp-indexer/react';
 *
 * function InfiniteFollowerList({ address }: { address: string }) {
 *   const {
 *     follows,
 *     hasNextPage,
 *     fetchNextPage,
 *     isFetchingNextPage,
 *     isLoading,
 *   } = useInfiniteFollows({
 *     filter: { followedAddress: address },
 *   });
 *
 *   return (
 *     <div>
 *       {follows.map((f) => (
 *         <div key={f.followerAddress}>{f.followerAddress}</div>
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
export function useInfiniteFollows<const I extends FollowerInclude>(
  params: UseInfiniteFollowsParams & { include: I },
): UseInfiniteFollowsReturn<FollowerResult<I>>;
export function useInfiniteFollows(
  params: Omit<UseInfiniteFollowsParams, "include"> & { include?: never },
): UseInfiniteFollowsReturn<Follower>;
export function useInfiniteFollows(
  params: UseInfiniteFollowsParams & { include?: FollowerInclude },
): UseInfiniteFollowsReturn<PartialFollower>;
export function useInfiniteFollows(
  params: UseInfiniteFollowsParams & { include?: FollowerInclude },
): UseInfiniteFollowsReturn<PartialFollower> {
  const url = getClientUrl();
  const { filter, sort, pageSize = DEFAULT_PAGE_SIZE, include } = params;

  const result = useInfiniteQuery({
    queryKey: followerKeys.infinite(filter, sort, include),
    queryFn: ({ pageParam }) =>
      include
        ? fetchFollows(url, {
            filter,
            sort,
            limit: pageSize,
            offset: pageParam,
            include,
          })
        : fetchFollows(url, {
            filter,
            sort,
            limit: pageSize,
            offset: pageParam,
          }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.follows.length < pageSize) {
        return undefined;
      }
      return lastPageParam + pageSize;
    },
  });

  // Flatten all pages into a single follows array (memoized to avoid re-flattening on every render)
  // Destructure infinite query properties before rest spread to avoid TS2783 duplicate property errors
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest } =
    result;
  const follows = useMemo(
    () => data?.pages.flatMap((page) => page.follows) ?? [],
    [data?.pages],
  );

  return {
    follows,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    ...rest,
  };
}

/**
 * Fetch follower and following counts for an address.
 *
 * Wraps `fetchFollowCount` in a TanStack `useQuery` hook. Returns two numbers:
 * - `followerCount` — how many profiles follow this address
 * - `followingCount` — how many profiles this address follows
 *
 * The query is disabled when `address` is falsy.
 *
 * @param params - Address whose follow counts to fetch
 * @returns `{ followerCount, followingCount, isLoading, error, ...rest }` — follow counts
 *   with full TanStack Query state
 *
 * @example
 * ```tsx
 * import { useFollowCount } from '@lsp-indexer/react';
 *
 * function FollowStats({ address }: { address: string }) {
 *   const { followerCount, followingCount, isLoading } = useFollowCount({ address });
 *
 *   if (isLoading) return <Skeleton />;
 *
 *   return (
 *     <div>
 *       <span>{followerCount} followers</span>
 *       <span>{followingCount} following</span>
 *     </div>
 *   );
 * }
 * ```
 */
export function useFollowCount(params: UseFollowCountParams) {
  const url = getClientUrl();
  const { address } = params;

  const { data, ...rest } = useQuery({
    queryKey: followerKeys.count(address),
    queryFn: () => fetchFollowCount(url, { address }),
    enabled: Boolean(address),
  });

  return {
    followerCount: data?.followerCount ?? 0,
    followingCount: data?.followingCount ?? 0,
    ...rest,
  };
}

/**
 * Check if one address follows another.
 *
 * Wraps `fetchIsFollowing` in a TanStack `useQuery` hook. Returns a boolean
 * indicating whether `followerAddress` follows `followedAddress`.
 *
 * The query is disabled when either address is falsy.
 *
 * @param params - Two addresses to check the follow relationship between
 * @returns `{ isFollowing, isLoading, error, ...rest }` — boolean result
 *   with full TanStack Query state
 *
 * @example
 * ```tsx
 * import { useIsFollowing } from '@lsp-indexer/react';
 *
 * function FollowButton({ viewer, profile }: { viewer: string; profile: string }) {
 *   const { isFollowing, isLoading } = useIsFollowing({
 *     followerAddress: viewer,
 *     followedAddress: profile,
 *   });
 *
 *   if (isLoading) return <Skeleton />;
 *
 *   return (
 *     <button>{isFollowing ? 'Unfollow' : 'Follow'}</button>
 *   );
 * }
 * ```
 */
export function useIsFollowing(params: UseIsFollowingParams) {
  const url = getClientUrl();
  const { followerAddress, followedAddress } = params;

  const { data, ...rest } = useQuery({
    queryKey: followerKeys.isFollowing(followerAddress, followedAddress),
    queryFn: () => fetchIsFollowing(url, { followerAddress, followedAddress }),
    enabled: Boolean(followerAddress) && Boolean(followedAddress),
  });

  return {
    isFollowing: data ?? false,
    ...rest,
  };
}

// ---------------------------------------------------------------------------
// Subscription hook
// ---------------------------------------------------------------------------

const DEFAULT_SUBSCRIPTION_LIMIT = 10;

interface UseFollowerSubscriptionParams {
  /** Filter criteria to narrow which followers to subscribe to */
  filter?: FollowerFilter;
  /** Control which nested fields are included in subscription data */
  include?: FollowerInclude;
  /** Maximum number of results per subscription update (default: 10) */
  limit?: number;
  /** Whether the subscription is active (default: true) */
  enabled?: boolean;
  /** Whether to invalidate TanStack Query cache on subscription data (default: false) */
  invalidate?: boolean;
  /** Callback fired when new subscription data arrives */
  onData?: (data: Follower[]) => void;
  /** Callback fired when the WebSocket reconnects after a disconnect */
  onReconnect?: () => void;
}

/**
 * Subscribe to real-time follower updates via WebSocket.
 *
 * Wraps the generic `useSubscription` hook with follower-specific document,
 * parser, and filter/include logic. Mirrors `useFollows` query behavior
 * but receives live updates instead of polling.
 *
 * @param params - Optional filter, include, limit, and callback config
 * @returns `{ data, isConnected, isSubscribed, error }` — subscription state
 *
 * @example
 * ```tsx
 * import { useFollowerSubscription } from '@lsp-indexer/react';
 *
 * function LiveFollowers({ address }: { address: string }) {
 *   const { data: followers, isConnected } = useFollowerSubscription({
 *     filter: { followedAddress: address },
 *     limit: 10,
 *   });
 *
 *   return (
 *     <div>
 *       <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
 *       {followers?.map((f) => (
 *         <div key={f.followerAddress}>{f.followerAddress}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFollowerSubscription(
  params: UseFollowerSubscriptionParams = {},
): UseSubscriptionReturn<Follower> {
  const {
    filter,
    include,
    limit = DEFAULT_SUBSCRIPTION_LIMIT,
    enabled = true,
    invalidate = false,
    onData,
    onReconnect,
  } = params;

  const where = buildFollowerWhere(filter);
  const includeVars = buildFollowerIncludeVars(include);

  let queryClient: QueryClient | undefined;
  try {
    queryClient = useQueryClient();
  } catch {
    // No QueryClientProvider — cache invalidation won't work but hook still functions
  }

  return useSubscription({
    document: FollowerSubscriptionDocument,
    dataKey: "follower",
    variables: {
      where: Object.keys(where).length > 0 ? where : undefined,
      order_by: undefined,
      limit,
      ...includeVars,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parser: (raw: any[]) => parseFollowers(raw),
    enabled,
    invalidate,
    invalidateKeys: invalidate ? [followerKeys.all] : undefined,
    queryClient: invalidate ? queryClient : undefined,
    onData,
    onReconnect,
  });
}
