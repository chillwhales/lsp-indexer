import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import {
  fetchFollowCount,
  fetchFollowers,
  fetchIsFollowing,
  followerKeys,
  getClientUrl,
} from '@lsp-indexer/node';
import type {
  FollowerInclude,
  PartialFollower,
  UseFollowCountParams,
  UseFollowersParams,
  UseFollowingParams,
  UseInfiniteFollowersParams,
  UseInfiniteFollowingParams,
  UseIsFollowingParams,
} from '@lsp-indexer/types';

/** Default number of followers per page for infinite scroll queries */
const DEFAULT_PAGE_SIZE = 20;

/**
 * Fetch a paginated list of followers for an address — "who follows this address?"
 *
 * Wraps `fetchFollowers` (with `direction: 'followers'`) in a TanStack `useQuery`
 * hook. Queries the `follower` table where `followed_address = address` to find
 * all profiles that follow the given address.
 *
 * The query is disabled when `address` is falsy. Supports filtering, sorting,
 * pagination, and optional include for field narrowing (DX-04).
 *
 * @param params - Address whose followers to fetch, plus optional filter/sort/pagination/include
 * @returns `{ followers, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `followers` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useFollowers } from '@lsp-indexer/react';
 *
 * function FollowerList({ address }: { address: string }) {
 *   const { followers, totalCount, isLoading } = useFollowers({
 *     address,
 *     sort: { field: 'timestamp', direction: 'desc' },
 *     limit: 20,
 *   });
 *
 *   return (
 *     <div>
 *       <p>{totalCount} followers</p>
 *       {followers.map((f) => (
 *         <div key={f.followerAddress}>{f.followerAddress}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFollowers(params: UseFollowersParams & { include?: FollowerInclude }) {
  const url = getClientUrl();
  const { address, filter, sort, limit, offset, include } = params;

  const { data, ...rest } = useQuery({
    queryKey: followerKeys.followersList(address, filter, sort, limit, offset, include),
    queryFn: () =>
      include
        ? fetchFollowers(url, {
            address,
            direction: 'followers',
            filter,
            sort,
            limit,
            offset,
            include,
          })
        : fetchFollowers(url, { address, direction: 'followers', filter, sort, limit, offset }),
    enabled: Boolean(address),
  });

  const followers: PartialFollower[] = data?.followers ?? [];
  return { followers, totalCount: data?.totalCount ?? 0, ...rest };
}

/**
 * Fetch followers with infinite scroll pagination — "who follows this address?"
 *
 * Wraps `fetchFollowers` (with `direction: 'followers'`) in a TanStack `useInfiniteQuery`
 * hook with offset-based pagination. Pages are automatically flattened into a single
 * `followers` array. Uses a **separate query key namespace** from `useFollowers` to
 * prevent cache corruption between standard and infinite query data structures.
 *
 * @param params - Address whose followers to fetch, plus optional filter/sort/pageSize/include
 * @returns `{ followers, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened followers array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteFollowers } from '@lsp-indexer/react';
 *
 * function InfiniteFollowerList({ address }: { address: string }) {
 *   const {
 *     followers,
 *     hasNextPage,
 *     fetchNextPage,
 *     isFetchingNextPage,
 *     isLoading,
 *   } = useInfiniteFollowers({ address });
 *
 *   return (
 *     <div>
 *       {followers.map((f) => (
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
export function useInfiniteFollowers(
  params: UseInfiniteFollowersParams & { include?: FollowerInclude },
) {
  const url = getClientUrl();
  const { address, filter, sort, pageSize = DEFAULT_PAGE_SIZE, include } = params;

  const result = useInfiniteQuery({
    queryKey: followerKeys.followersInfinite(address, filter, sort, include),
    queryFn: ({ pageParam }) =>
      include
        ? fetchFollowers(url, {
            address,
            direction: 'followers',
            filter,
            sort,
            limit: pageSize,
            offset: pageParam,
            include,
          })
        : fetchFollowers(url, {
            address,
            direction: 'followers',
            filter,
            sort,
            limit: pageSize,
            offset: pageParam,
          }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.followers.length < pageSize) {
        return undefined;
      }
      return lastPageParam + pageSize;
    },
    enabled: Boolean(address),
  });

  // Flatten all pages into a single followers array (memoized to avoid re-flattening on every render)
  // Destructure infinite query properties before rest spread to avoid TS2783 duplicate property errors
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest } = result;
  const followers: PartialFollower[] = useMemo(
    () => data?.pages.flatMap((page) => page.followers) ?? [],
    [data?.pages],
  );

  return {
    followers,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    ...rest,
  };
}

/**
 * Fetch a paginated list of who an address follows — "who does this address follow?"
 *
 * Wraps `fetchFollowers` (with `direction: 'following'`) in a TanStack `useQuery`
 * hook. Queries the `follower` table where `follower_address = address` to find
 * all profiles that the given address follows.
 *
 * The query is disabled when `address` is falsy. Supports filtering, sorting,
 * pagination, and optional include for field narrowing (DX-04).
 *
 * @param params - Address whose following list to fetch, plus optional filter/sort/pagination/include
 * @returns `{ following, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `following` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useFollowing } from '@lsp-indexer/react';
 *
 * function FollowingList({ address }: { address: string }) {
 *   const { following, totalCount, isLoading } = useFollowing({
 *     address,
 *     sort: { field: 'timestamp', direction: 'desc' },
 *     limit: 20,
 *   });
 *
 *   return (
 *     <div>
 *       <p>Following {totalCount}</p>
 *       {following.map((f) => (
 *         <div key={f.followedAddress}>{f.followedAddress}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFollowing(params: UseFollowingParams & { include?: FollowerInclude }) {
  const url = getClientUrl();
  const { address, filter, sort, limit, offset, include } = params;

  const { data, ...rest } = useQuery({
    queryKey: followerKeys.followingList(address, filter, sort, limit, offset, include),
    queryFn: () =>
      include
        ? fetchFollowers(url, {
            address,
            direction: 'following',
            filter,
            sort,
            limit,
            offset,
            include,
          })
        : fetchFollowers(url, { address, direction: 'following', filter, sort, limit, offset }),
    enabled: Boolean(address),
  });

  const following: PartialFollower[] = data?.followers ?? [];
  return { following, totalCount: data?.totalCount ?? 0, ...rest };
}

/**
 * Fetch following with infinite scroll pagination — "who does this address follow?"
 *
 * Wraps `fetchFollowers` (with `direction: 'following'`) in a TanStack `useInfiniteQuery`
 * hook with offset-based pagination. Pages are automatically flattened into a single
 * `following` array. Uses a **separate query key namespace** from `useFollowing` to
 * prevent cache corruption between standard and infinite query data structures.
 *
 * @param params - Address whose following list to fetch, plus optional filter/sort/pageSize/include
 * @returns `{ following, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened following array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteFollowing } from '@lsp-indexer/react';
 *
 * function InfiniteFollowingList({ address }: { address: string }) {
 *   const {
 *     following,
 *     hasNextPage,
 *     fetchNextPage,
 *     isFetchingNextPage,
 *     isLoading,
 *   } = useInfiniteFollowing({ address });
 *
 *   return (
 *     <div>
 *       {following.map((f) => (
 *         <div key={f.followedAddress}>{f.followedAddress}</div>
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
export function useInfiniteFollowing(
  params: UseInfiniteFollowingParams & { include?: FollowerInclude },
) {
  const url = getClientUrl();
  const { address, filter, sort, pageSize = DEFAULT_PAGE_SIZE, include } = params;

  const result = useInfiniteQuery({
    queryKey: followerKeys.followingInfinite(address, filter, sort, include),
    queryFn: ({ pageParam }) =>
      include
        ? fetchFollowers(url, {
            address,
            direction: 'following',
            filter,
            sort,
            limit: pageSize,
            offset: pageParam,
            include,
          })
        : fetchFollowers(url, {
            address,
            direction: 'following',
            filter,
            sort,
            limit: pageSize,
            offset: pageParam,
          }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.followers.length < pageSize) {
        return undefined;
      }
      return lastPageParam + pageSize;
    },
    enabled: Boolean(address),
  });

  // Flatten all pages into a single following array (memoized to avoid re-flattening on every render)
  // Destructure infinite query properties before rest spread to avoid TS2783 duplicate property errors
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest } = result;
  const following: PartialFollower[] = useMemo(
    () => data?.pages.flatMap((page) => page.followers) ?? [],
    [data?.pages],
  );

  return {
    following,
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
