import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { ownedAssetKeys, ownedTokenKeys } from '@lsp-indexer/node';
import type {
  UseInfiniteOwnedAssetsParams,
  UseInfiniteOwnedTokensParams,
  UseOwnedAssetsParams,
  UseOwnedTokensParams,
} from '@lsp-indexer/types';

import { getOwnedAssets, getOwnedTokens } from '../actions/owned-assets';

/** Default number of items per page for infinite scroll queries */
const DEFAULT_PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Owned Assets (LSP7 fungible tokens)
// ---------------------------------------------------------------------------

/**
 * Fetch a paginated list of owned assets via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useOwnedAssets`, but routes the
 * request through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter, sort, and pagination config
 * @returns `{ ownedAssets, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `ownedAssets` and `totalCount`
 */
export function useOwnedAssets(params: UseOwnedAssetsParams = {}) {
  const { filter, sort, limit, offset } = params;

  const { data, ...rest } = useQuery({
    queryKey: ownedAssetKeys.list(filter, sort, limit, offset),
    queryFn: () => getOwnedAssets({ filter, sort, limit, offset }),
  });

  return {
    ownedAssets: data?.ownedAssets ?? [],
    totalCount: data?.totalCount ?? 0,
    ...rest,
  };
}

/**
 * Fetch owned assets with infinite scroll pagination via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useInfiniteOwnedAssets`, but routes
 * the request through a server action instead of calling Hasura directly.
 *
 * @param params - Optional filter, sort, and pageSize config
 * @returns `{ ownedAssets, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened owned assets array with infinite scroll controls
 */
export function useInfiniteOwnedAssets(params: UseInfiniteOwnedAssetsParams = {}) {
  const { filter, sort, pageSize = DEFAULT_PAGE_SIZE } = params;

  const result = useInfiniteQuery({
    queryKey: ownedAssetKeys.infinite(filter, sort),
    queryFn: ({ pageParam }) =>
      getOwnedAssets({
        filter,
        sort,
        limit: pageSize,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.ownedAssets.length < pageSize) {
        return undefined;
      }
      return lastPageParam + pageSize;
    },
  });

  // Destructure infinite query properties before rest spread to avoid TS2783
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
// Owned Tokens (LSP8 NFTs with tokenId)
// ---------------------------------------------------------------------------

/**
 * Fetch a paginated list of owned tokens via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useOwnedTokens`, but routes the
 * request through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter, sort, and pagination config
 * @returns `{ ownedTokens, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `ownedTokens` and `totalCount`
 */
export function useOwnedTokens(params: UseOwnedTokensParams = {}) {
  const { filter, sort, limit, offset } = params;

  const { data, ...rest } = useQuery({
    queryKey: ownedTokenKeys.list(filter, sort, limit, offset),
    queryFn: () => getOwnedTokens({ filter, sort, limit, offset }),
  });

  return {
    ownedTokens: data?.ownedTokens ?? [],
    totalCount: data?.totalCount ?? 0,
    ...rest,
  };
}

/**
 * Fetch owned tokens with infinite scroll pagination via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useInfiniteOwnedTokens`, but routes
 * the request through a server action instead of calling Hasura directly.
 *
 * @param params - Optional filter, sort, and pageSize config
 * @returns `{ ownedTokens, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened owned tokens array with infinite scroll controls
 */
export function useInfiniteOwnedTokens(params: UseInfiniteOwnedTokensParams = {}) {
  const { filter, sort, pageSize = DEFAULT_PAGE_SIZE } = params;

  const result = useInfiniteQuery({
    queryKey: ownedTokenKeys.infinite(filter, sort),
    queryFn: ({ pageParam }) =>
      getOwnedTokens({
        filter,
        sort,
        limit: pageSize,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.ownedTokens.length < pageSize) {
        return undefined;
      }
      return lastPageParam + pageSize;
    },
  });

  // Destructure infinite query properties before rest spread to avoid TS2783
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
