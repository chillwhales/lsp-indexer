import type { InfiniteData, UseInfiniteQueryResult, UseQueryResult } from '@tanstack/react-query';
import { useInfiniteQuery, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { FetchProfilesResult } from '@lsp-indexer/node';
import {
  buildProfileIncludeVars,
  buildProfileWhere,
  fetchProfile,
  fetchProfiles,
  getClientUrl,
  parseProfiles,
  profileKeys,
  ProfileSubscriptionDocument,
} from '@lsp-indexer/node';
import type {
  PartialProfile,
  Profile,
  ProfileFilter,
  ProfileInclude,
  ProfileResult,
  UseInfiniteProfilesParams,
  UseProfileParams,
  UseProfilesParams,
} from '@lsp-indexer/types';

import { useSubscription } from '../subscriptions/use-subscription';
import type { UseSubscriptionReturn } from '../subscriptions/use-subscription';

/** Default number of profiles per page for infinite scroll queries */
const DEFAULT_PAGE_SIZE = 20;

/** Flat return shape for useProfile — profile + query state */
type UseProfileReturn<F> = { profile: F | null } & Omit<UseQueryResult<F | null, Error>, 'data'>;

/** Flat return shape for useProfiles — profiles array + totalCount + query state */
type UseProfilesReturn<F> = { profiles: F[]; totalCount: number } & Omit<
  UseQueryResult<FetchProfilesResult<F>, Error>,
  'data'
>;

/** Flat return shape for useInfiniteProfiles — profiles array + infinite scroll controls + query state */
type UseInfiniteProfilesReturn<F> = {
  profiles: F[];
  hasNextPage: boolean;
  fetchNextPage: UseInfiniteQueryResult['fetchNextPage'];
  isFetchingNextPage: boolean;
} & Omit<
  UseInfiniteQueryResult<InfiniteData<FetchProfilesResult<F>>, Error>,
  'data' | 'hasNextPage' | 'fetchNextPage' | 'isFetchingNextPage'
>;

/**
 * Fetch a single Universal Profile by address.
 *
 * Wraps `fetchProfile` in a TanStack `useQuery` hook with automatic caching,
 * deduplication, and stale-while-revalidate. The query is disabled when
 * `address` is falsy (empty string, undefined via type widening, etc.).
 *
 * @param params - Profile address and optional include config
 * @returns `{ profile, isLoading, error, ...rest }` — full TanStack Query result
 *   with `data` renamed to `profile`
 *
 * @example
 * ```tsx
 * import { useProfile } from '@lsp-indexer/react';
 *
 * function ProfileCard({ address }: { address: string }) {
 *   const { profile, isLoading, error } = useProfile({ address });
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <Alert>{error.message}</Alert>;
 *   if (!profile) return <p>Profile not found</p>;
 *
 *   return (
 *     <div>
 *       <h2>{profile.name ?? 'Unnamed'}</h2>
 *       <p>{profile.followerCount} followers</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useProfile<const I extends ProfileInclude>(
  params: UseProfileParams & { include: I },
): UseProfileReturn<ProfileResult<I>>;
export function useProfile(
  params: Omit<UseProfileParams, 'include'> & { include?: never },
): UseProfileReturn<Profile>;
export function useProfile(
  params: UseProfileParams & { include?: ProfileInclude },
): UseProfileReturn<PartialProfile>;
export function useProfile(
  params: UseProfileParams & { include?: ProfileInclude },
): UseProfileReturn<PartialProfile> {
  const url = getClientUrl();
  const { address, include } = params;

  const { data, ...rest } = useQuery({
    queryKey: profileKeys.detail(address, include),
    queryFn: () =>
      include ? fetchProfile(url, { address, include }) : fetchProfile(url, { address }),
    enabled: Boolean(address),
  });

  const profile = data ?? null;
  return { profile, ...rest };
}

/**
 * Fetch a paginated list of Universal Profiles with filtering and sorting.
 *
 * Wraps `fetchProfiles` in a TanStack `useQuery` hook. Supports comprehensive
 * filtering (by name, follow relationships, token ownership) and sorting
 * (by name, follower count, following count).
 *
 * @param params - Optional filter, sort, pagination, and include config
 * @returns `{ profiles, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `profiles` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useProfiles } from '@lsp-indexer/react';
 *
 * function ProfileList() {
 *   const { profiles, totalCount, isLoading } = useProfiles({
 *     filter: { name: 'alice' },
 *     sort: { field: 'followerCount', direction: 'desc' },
 *     limit: 20,
 *     offset: 0,
 *   });
 *
 *   return (
 *     <div>
 *       <p>{totalCount} profiles found</p>
 *       {profiles.map((p) => (
 *         <div key={p.address}>{p.name}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useProfiles<const I extends ProfileInclude>(
  params: UseProfilesParams & { include: I },
): UseProfilesReturn<ProfileResult<I>>;
export function useProfiles(
  params?: Omit<UseProfilesParams, 'include'> & { include?: never },
): UseProfilesReturn<Profile>;
export function useProfiles(
  params: UseProfilesParams & { include?: ProfileInclude },
): UseProfilesReturn<PartialProfile>;
export function useProfiles(
  params: UseProfilesParams & { include?: ProfileInclude } = {},
): UseProfilesReturn<PartialProfile> {
  const url = getClientUrl();
  const { filter, sort, limit, offset, include } = params;

  const { data, ...rest } = useQuery({
    queryKey: profileKeys.list(filter, sort, limit, offset, include),
    queryFn: () =>
      include
        ? fetchProfiles(url, { filter, sort, limit, offset, include })
        : fetchProfiles(url, { filter, sort, limit, offset }),
  });

  const profiles = data?.profiles ?? [];
  return { profiles, totalCount: data?.totalCount ?? 0, ...rest };
}

/**
 * Fetch Universal Profiles with infinite scroll pagination.
 *
 * Wraps `fetchProfiles` in a TanStack `useInfiniteQuery` hook with offset-based
 * pagination. Pages are automatically flattened into a single `profiles` array.
 * Uses a **separate query key namespace** from `useProfiles` to prevent cache
 * corruption between standard and infinite query data structures.
 *
 * @param params - Optional filter, sort, pageSize, and include config
 * @returns `{ profiles, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened profiles array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteProfiles } from '@lsp-indexer/react';
 *
 * function InfiniteProfileList() {
 *   const {
 *     profiles,
 *     hasNextPage,
 *     fetchNextPage,
 *     isFetchingNextPage,
 *     isLoading,
 *   } = useInfiniteProfiles({
 *     filter: { followedBy: '0x1234...' },
 *     sort: { field: 'name', direction: 'asc' },
 *     pageSize: 20,
 *   });
 *
 *   return (
 *     <div>
 *       {profiles.map((p) => (
 *         <div key={p.address}>{p.name}</div>
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
export function useInfiniteProfiles<const I extends ProfileInclude>(
  params: UseInfiniteProfilesParams & { include: I },
): UseInfiniteProfilesReturn<ProfileResult<I>>;
export function useInfiniteProfiles(
  params?: Omit<UseInfiniteProfilesParams, 'include'> & { include?: never },
): UseInfiniteProfilesReturn<Profile>;
export function useInfiniteProfiles(
  params: UseInfiniteProfilesParams & { include?: ProfileInclude },
): UseInfiniteProfilesReturn<PartialProfile>;
export function useInfiniteProfiles(
  params: UseInfiniteProfilesParams & { include?: ProfileInclude } = {},
): UseInfiniteProfilesReturn<PartialProfile> {
  const url = getClientUrl();
  const { filter, sort, pageSize = DEFAULT_PAGE_SIZE, include } = params;

  const result = useInfiniteQuery({
    queryKey: profileKeys.infinite(filter, sort, include),
    queryFn: ({ pageParam }) =>
      include
        ? fetchProfiles(url, { filter, sort, limit: pageSize, offset: pageParam, include })
        : fetchProfiles(url, { filter, sort, limit: pageSize, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.profiles.length < pageSize) {
        return undefined;
      }
      return lastPageParam + pageSize;
    },
  });

  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest } = result;
  const profiles = useMemo(() => data?.pages.flatMap((page) => page.profiles) ?? [], [data?.pages]);

  return {
    profiles,
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

interface UseProfileSubscriptionParams {
  /** Filter criteria to narrow which profiles to subscribe to */
  filter?: ProfileFilter;
  /** Control which nested fields are included in subscription data */
  include?: ProfileInclude;
  /** Maximum number of results per subscription update (default: 10) */
  limit?: number;
  /** Whether the subscription is active (default: true) */
  enabled?: boolean;
  /** Whether to invalidate TanStack Query cache on subscription data (default: false) */
  invalidate?: boolean;
  /** Callback fired when new subscription data arrives */
  onData?: (data: Profile[]) => void;
  /** Callback fired when the WebSocket reconnects after a disconnect */
  onReconnect?: () => void;
}

/**
 * Subscribe to real-time Universal Profile updates via WebSocket.
 *
 * Wraps the generic `useSubscription` hook with profile-specific document,
 * parser, and filter/include logic. Mirrors `useProfiles` query behavior
 * but receives live updates instead of polling.
 *
 * @param params - Optional filter, include, limit, and callback config
 * @returns `{ data, isConnected, isSubscribed, error }` — subscription state
 *
 * @example
 * ```tsx
 * import { useProfileSubscription } from '@lsp-indexer/react';
 *
 * function LiveProfiles() {
 *   const { data: profiles, isConnected } = useProfileSubscription({
 *     filter: { name: 'alice' },
 *     limit: 5,
 *   });
 *
 *   return (
 *     <div>
 *       <span>{isConnected ? '🟢' : '🔴'}</span>
 *       {profiles?.map((p) => <div key={p.address}>{p.name}</div>)}
 *     </div>
 *   );
 * }
 * ```
 */
export function useProfileSubscription(
  params: UseProfileSubscriptionParams = {},
): UseSubscriptionReturn<Profile> {
  const {
    filter,
    include,
    limit = DEFAULT_SUBSCRIPTION_LIMIT,
    enabled = true,
    invalidate = false,
    onData,
    onReconnect,
  } = params;

  const where = buildProfileWhere(filter);
  const includeVars = buildProfileIncludeVars(include);

  let queryClient: QueryClient | undefined;
  try {
    queryClient = useQueryClient();
  } catch {
    // No QueryClientProvider — cache invalidation won't work but hook still functions
  }

  return useSubscription({
    document: ProfileSubscriptionDocument,
    dataKey: 'universal_profile',
    variables: {
      where: Object.keys(where).length > 0 ? where : undefined,
      order_by: undefined,
      limit,
      ...includeVars,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parser: (raw: any[]) => parseProfiles(raw),
    enabled,
    invalidate,
    invalidateKeys: invalidate ? [profileKeys.all] : undefined,
    queryClient: invalidate ? queryClient : undefined,
    onData,
    onReconnect,
  });
}
