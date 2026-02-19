import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import {
  fetchFollowCount,
  fetchFollowers,
  fetchFollowing,
  followerKeys,
  getClientUrl,
} from '@lsp-indexer/node';
import type {
  UseFollowCountParams,
  UseFollowersParams,
  UseFollowingParams,
  UseInfiniteFollowersParams,
  UseInfiniteFollowingParams,
} from '@lsp-indexer/types';

/** Default number of followers per page for infinite scroll queries */
const DEFAULT_PAGE_SIZE = 20;

/**
 * Fetch followers of an address (who follows this address).
 *
 * Wraps `fetchFollowers` in a TanStack `useQuery` hook with automatic caching,
 * deduplication, and stale-while-revalidate. The query is disabled when
 * `address` is falsy.
 *
 * @param params - Address and optional sort/pagination
 * @returns `{ followers, totalCount, ...rest }` — full TanStack Query result
 *
 * @example
 * ```tsx
 * const { followers, totalCount, isLoading } = useFollowers({
 *   address: '0x...',
 *   sort: { field: 'followerAddress', direction: 'asc' },
 *   limit: 20,
 * });
 * ```
 */
export function useFollowers(params: UseFollowersParams) {
  const url = getClientUrl();
  const { address, sort, limit, offset } = params;

  const { data, ...rest } = useQuery({
    queryKey: followerKeys.followers(address),
    queryFn: () => fetchFollowers(url, { address, sort, limit, offset }),
    enabled: Boolean(address),
  });

  return {
    followers: data?.followers ?? [],
    totalCount: data?.totalCount ?? 0,
    ...rest,
  };
}

/**
 * Fetch who an address is following (addresses this address follows).
 *
 * Wraps `fetchFollowing` in a TanStack `useQuery` hook.
 *
 * @param params - Address and optional sort/pagination
 * @returns `{ following, totalCount, ...rest }` — full TanStack Query result
 *
 * @example
 * ```tsx
 * const { following, totalCount, isLoading } = useFollowing({
 *   address: '0x...',
 *   sort: { field: 'followedAddress', direction: 'asc' },
 * });
 * ```
 */
export function useFollowing(params: UseFollowingParams) {
  const url = getClientUrl();
  const { address, sort, limit, offset } = params;

  const { data, ...rest } = useQuery({
    queryKey: followerKeys.following(address),
    queryFn: () => fetchFollowing(url, { address, sort, limit, offset }),
    enabled: Boolean(address),
  });

  return {
    following: data?.following ?? [],
    totalCount: data?.totalCount ?? 0,
    ...rest,
  };
}

/**
 * Fetch follow counts (followerCount + followingCount) for an address.
 *
 * Returns scalar counts — NOT a list. There is no infinite variant for this hook.
 *
 * @param params - Address to get counts for
 * @returns `{ followCount, ...rest }` where followCount has `{ followerCount, followingCount }`
 *
 * @example
 * ```tsx
 * const { followCount, isLoading } = useFollowCount({ address: '0x...' });
 * if (followCount) {
 *   console.log(`${followCount.followerCount} followers, ${followCount.followingCount} following`);
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

  return { followCount: data ?? null, ...rest };
}

/**
 * Fetch followers with infinite scroll pagination.
 *
 * Wraps `fetchFollowers` in a TanStack `useInfiniteQuery` hook with offset-based
 * pagination. Pages are automatically flattened into a single `followers` array.
 *
 * @param params - Address and optional sort/pageSize
 * @returns `{ followers, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }`
 *
 * @example
 * ```tsx
 * const { followers, hasNextPage, fetchNextPage, isFetchingNextPage } =
 *   useInfiniteFollowers({ address: '0x...', pageSize: 20 });
 * ```
 */
export function useInfiniteFollowers(params: UseInfiniteFollowersParams) {
  const url = getClientUrl();
  const { address, sort, pageSize = DEFAULT_PAGE_SIZE } = params;

  const result = useInfiniteQuery({
    queryKey: followerKeys.infiniteFollowers(address, sort),
    queryFn: ({ pageParam }) =>
      fetchFollowers(url, {
        address,
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

  // Destructure infinite query properties before rest spread to avoid TS2783
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest } = result;
  const followers = useMemo(
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
 * Fetch following with infinite scroll pagination.
 *
 * Wraps `fetchFollowing` in a TanStack `useInfiniteQuery` hook with offset-based
 * pagination. Pages are automatically flattened into a single `following` array.
 *
 * @param params - Address and optional sort/pageSize
 * @returns `{ following, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }`
 *
 * @example
 * ```tsx
 * const { following, hasNextPage, fetchNextPage, isFetchingNextPage } =
 *   useInfiniteFollowing({ address: '0x...', pageSize: 20 });
 * ```
 */
export function useInfiniteFollowing(params: UseInfiniteFollowingParams) {
  const url = getClientUrl();
  const { address, sort, pageSize = DEFAULT_PAGE_SIZE } = params;

  const result = useInfiniteQuery({
    queryKey: followerKeys.infiniteFollowing(address, sort),
    queryFn: ({ pageParam }) =>
      fetchFollowing(url, {
        address,
        sort,
        limit: pageSize,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.following.length < pageSize) {
        return undefined;
      }
      return lastPageParam + pageSize;
    },
    enabled: Boolean(address),
  });

  // Destructure infinite query properties before rest spread to avoid TS2783
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest } = result;
  const following = useMemo(
    () => data?.pages.flatMap((page) => page.following) ?? [],
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
