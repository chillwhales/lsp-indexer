import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { followerKeys } from '@lsp-indexer/node';
import type {
  UseFollowCountParams,
  UseFollowersParams,
  UseFollowingParams,
  UseInfiniteFollowersParams,
  UseInfiniteFollowingParams,
} from '@lsp-indexer/types';

import { getFollowCount, getFollowers, getFollowing } from '../actions/social';

/** Default number of followers per page for infinite scroll queries */
const DEFAULT_PAGE_SIZE = 20;

/**
 * Fetch followers of an address via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useFollowers`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Address and optional sort/pagination
 * @returns `{ followers, totalCount, ...rest }` — full TanStack Query result
 */
export function useFollowers(params: UseFollowersParams) {
  const { address, sort, limit, offset } = params;

  const { data, ...rest } = useQuery({
    queryKey: followerKeys.followers(address),
    queryFn: () => getFollowers({ address, sort, limit, offset }),
    enabled: Boolean(address),
  });

  return {
    followers: data?.followers ?? [],
    totalCount: data?.totalCount ?? 0,
    ...rest,
  };
}

/**
 * Fetch who an address is following via Next.js server action.
 *
 * @param params - Address and optional sort/pagination
 * @returns `{ following, totalCount, ...rest }` — full TanStack Query result
 */
export function useFollowing(params: UseFollowingParams) {
  const { address, sort, limit, offset } = params;

  const { data, ...rest } = useQuery({
    queryKey: followerKeys.following(address),
    queryFn: () => getFollowing({ address, sort, limit, offset }),
    enabled: Boolean(address),
  });

  return {
    following: data?.following ?? [],
    totalCount: data?.totalCount ?? 0,
    ...rest,
  };
}

/**
 * Fetch follow counts via Next.js server action.
 *
 * Returns scalar counts — NOT a list. There is no infinite variant.
 *
 * @param params - Address to get counts for
 * @returns `{ followCount, ...rest }` where followCount has `{ followerCount, followingCount }`
 */
export function useFollowCount(params: UseFollowCountParams) {
  const { address } = params;

  const { data, ...rest } = useQuery({
    queryKey: followerKeys.count(address),
    queryFn: () => getFollowCount({ address }),
    enabled: Boolean(address),
  });

  return { followCount: data ?? null, ...rest };
}

/**
 * Fetch followers with infinite scroll pagination via Next.js server action.
 *
 * @param params - Address and optional sort/pageSize
 * @returns `{ followers, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }`
 */
export function useInfiniteFollowers(params: UseInfiniteFollowersParams) {
  const { address, sort, pageSize = DEFAULT_PAGE_SIZE } = params;

  const result = useInfiniteQuery({
    queryKey: followerKeys.infiniteFollowers(address, sort),
    queryFn: ({ pageParam }) =>
      getFollowers({
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
 * Fetch following with infinite scroll pagination via Next.js server action.
 *
 * @param params - Address and optional sort/pageSize
 * @returns `{ following, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }`
 */
export function useInfiniteFollowing(params: UseInfiniteFollowingParams) {
  const { address, sort, pageSize = DEFAULT_PAGE_SIZE } = params;

  const result = useInfiniteQuery({
    queryKey: followerKeys.infiniteFollowing(address, sort),
    queryFn: ({ pageParam }) =>
      getFollowing({
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
