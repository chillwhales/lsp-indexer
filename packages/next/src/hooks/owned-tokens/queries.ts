'use client';

import type { InfiniteData, UseInfiniteQueryResult, UseQueryResult } from '@tanstack/react-query';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { FetchOwnedTokensResult } from '@lsp-indexer/node';
import { ownedTokenKeys } from '@lsp-indexer/node';
import type {
  OwnedToken,
  OwnedTokenInclude,
  OwnedTokenResult,
  PartialOwnedToken,
  UseInfiniteOwnedTokensParams,
  UseOwnedTokenParams,
  UseOwnedTokensParams,
} from '@lsp-indexer/types';

import { getOwnedToken, getOwnedTokens } from '../../actions/owned-tokens';

/** Default number of owned tokens per page for infinite scroll queries */
const DEFAULT_PAGE_SIZE = 20;

/** Flat return shape for useOwnedToken — ownedToken + query state */
type UseOwnedTokenReturn<F> = { ownedToken: F | null } & Omit<
  UseQueryResult<F | null, Error>,
  'data'
>;

/** Flat return shape for useOwnedTokens — ownedTokens array + totalCount + query state */
type UseOwnedTokensReturn<F> = { ownedTokens: F[]; totalCount: number } & Omit<
  UseQueryResult<FetchOwnedTokensResult<F>, Error>,
  'data'
>;

/** Flat return shape for useInfiniteOwnedTokens — ownedTokens array + infinite scroll controls + query state */
type UseInfiniteOwnedTokensReturn<F> = {
  ownedTokens: F[];
  hasNextPage: boolean;
  fetchNextPage: UseInfiniteQueryResult['fetchNextPage'];
  isFetchingNextPage: boolean;
} & Omit<
  UseInfiniteQueryResult<InfiniteData<FetchOwnedTokensResult<F>>, Error>,
  'data' | 'hasNextPage' | 'fetchNextPage' | 'isFetchingNextPage'
>;

/**
 * Fetch a single owned token by unique ID via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useOwnedToken`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 * This keeps the GraphQL endpoint hidden from the client.
 *
 * @param params - Owned token ID and optional include config
 * @returns `{ ownedToken, isLoading, error, ...rest }` — full TanStack Query result
 *   with `data` renamed to `ownedToken`
 *
 * @example
 * ```tsx
 * import { useOwnedToken } from '@lsp-indexer/next';
 *
 * function OwnedTokenCard({ id }: { id: string }) {
 *   const { ownedToken, isLoading, error } = useOwnedToken({ id });
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <Alert>{error.message}</Alert>;
 *   if (!ownedToken) return <p>Owned token not found</p>;
 *
 *   return (
 *     <div>
 *       <h2>{ownedToken.digitalAssetAddress}</h2>
 *       <p>Token ID: {ownedToken.tokenId}</p>
 *       <p>Holder: {ownedToken.holderAddress}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useOwnedToken<const I extends OwnedTokenInclude>(
  params: UseOwnedTokenParams & { include: I },
): UseOwnedTokenReturn<OwnedTokenResult<I>>;
export function useOwnedToken(
  params: Omit<UseOwnedTokenParams, 'include'> & { include?: never },
): UseOwnedTokenReturn<OwnedToken>;
export function useOwnedToken(
  params: UseOwnedTokenParams & { include?: OwnedTokenInclude },
): UseOwnedTokenReturn<PartialOwnedToken>;
export function useOwnedToken(
  params: UseOwnedTokenParams & { include?: OwnedTokenInclude },
): UseOwnedTokenReturn<PartialOwnedToken> {
  const { id, include } = params;

  const { data, ...rest } = useQuery({
    queryKey: ownedTokenKeys.detail(id, include),
    queryFn: () => (include ? getOwnedToken(id, include) : getOwnedToken(id)),
    enabled: Boolean(id),
  });

  const ownedToken = data ?? null;
  return { ownedToken, ...rest };
}

/**
 * Fetch a paginated list of owned tokens via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useOwnedTokens`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter, sort, pagination, and include config
 * @returns `{ ownedTokens, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `ownedTokens` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useOwnedTokens } from '@lsp-indexer/next';
 *
 * function OwnedTokenList({ holderAddress }: { holderAddress: string }) {
 *   const { ownedTokens, totalCount, isLoading } = useOwnedTokens({
 *     filter: { holderAddress },
 *     sort: { field: 'tokenId', direction: 'asc' },
 *     limit: 20,
 *     offset: 0,
 *   });
 *
 *   return (
 *     <div>
 *       <p>{totalCount} owned tokens found</p>
 *       {ownedTokens.map((t) => (
 *         <div key={t.id}>{t.digitalAssetAddress} — {t.tokenId}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useOwnedTokens<const I extends OwnedTokenInclude>(
  params: UseOwnedTokensParams & { include: I },
): UseOwnedTokensReturn<OwnedTokenResult<I>>;
export function useOwnedTokens(
  params?: Omit<UseOwnedTokensParams, 'include'> & { include?: never },
): UseOwnedTokensReturn<OwnedToken>;
export function useOwnedTokens(
  params: UseOwnedTokensParams & { include?: OwnedTokenInclude },
): UseOwnedTokensReturn<PartialOwnedToken>;
export function useOwnedTokens(
  params: UseOwnedTokensParams & { include?: OwnedTokenInclude } = {},
): UseOwnedTokensReturn<PartialOwnedToken> {
  const { filter, sort, limit, offset, include } = params;

  const { data, ...rest } = useQuery({
    queryKey: ownedTokenKeys.list(filter, sort, limit, offset, include),
    queryFn: () =>
      include
        ? getOwnedTokens({ filter, sort, limit, offset, include })
        : getOwnedTokens({ filter, sort, limit, offset }),
  });

  const ownedTokens = data?.ownedTokens ?? [];
  return { ownedTokens, totalCount: data?.totalCount ?? 0, ...rest };
}

/**
 * Fetch owned tokens with infinite scroll pagination via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useInfiniteOwnedTokens`, but routes the
 * request through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter, sort, pageSize, and include config
 * @returns `{ ownedTokens, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened owned tokens array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteOwnedTokens } from '@lsp-indexer/next';
 *
 * function InfiniteOwnedTokenList({ holderAddress }: { holderAddress: string }) {
 *   const {
 *     ownedTokens,
 *     hasNextPage,
 *     fetchNextPage,
 *     isFetchingNextPage,
 *     isLoading,
 *   } = useInfiniteOwnedTokens({
 *     filter: { holderAddress },
 *     sort: { field: 'tokenId', direction: 'asc' },
 *     pageSize: 20,
 *   });
 *
 *   return (
 *     <div>
 *       {ownedTokens.map((t) => (
 *         <div key={t.id}>{t.digitalAssetAddress} — {t.tokenId}</div>
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
export function useInfiniteOwnedTokens<const I extends OwnedTokenInclude>(
  params: UseInfiniteOwnedTokensParams & { include: I },
): UseInfiniteOwnedTokensReturn<OwnedTokenResult<I>>;
export function useInfiniteOwnedTokens(
  params?: Omit<UseInfiniteOwnedTokensParams, 'include'> & { include?: never },
): UseInfiniteOwnedTokensReturn<OwnedToken>;
export function useInfiniteOwnedTokens(
  params: UseInfiniteOwnedTokensParams & { include?: OwnedTokenInclude },
): UseInfiniteOwnedTokensReturn<PartialOwnedToken>;
export function useInfiniteOwnedTokens(
  params: UseInfiniteOwnedTokensParams & { include?: OwnedTokenInclude } = {},
): UseInfiniteOwnedTokensReturn<PartialOwnedToken> {
  const { filter, sort, pageSize = DEFAULT_PAGE_SIZE, include } = params;

  const result = useInfiniteQuery({
    queryKey: ownedTokenKeys.infinite(filter, sort, include),
    queryFn: ({ pageParam }) =>
      include
        ? getOwnedTokens({ filter, sort, limit: pageSize, offset: pageParam, include })
        : getOwnedTokens({ filter, sort, limit: pageSize, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.ownedTokens.length < pageSize) {
        return undefined;
      }
      return lastPageParam + pageSize;
    },
  });

  // Flatten all pages into a single ownedTokens array (memoized to avoid re-flattening on every render)
  // Destructure infinite query properties before rest spread to avoid TS2783 duplicate property errors
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest } = result;
  const ownedTokens = useMemo(
    () => data?.pages.flatMap((page) => page.ownedTokens) ?? [],
    [data?.pages],
  );

  return {
    ownedTokens,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    ...rest,
  };
}
