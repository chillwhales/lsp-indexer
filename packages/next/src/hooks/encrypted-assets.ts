import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { encryptedAssetKeys } from '@lsp-indexer/node';
import type {
  UseEncryptedAssetParams,
  UseEncryptedAssetsParams,
  UseInfiniteEncryptedAssetsParams,
} from '@lsp-indexer/types';

import { getEncryptedAsset, getEncryptedAssets } from '../actions/encrypted-assets';

/** Default number of encrypted assets per page for infinite scroll queries */
const DEFAULT_PAGE_SIZE = 20;

/**
 * Fetch a single LSP29 Encrypted Asset by address via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useEncryptedAsset`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 * This keeps the GraphQL endpoint hidden from the client.
 *
 * @param params - Encrypted asset address
 * @returns `{ encryptedAsset, isLoading, error, ...rest }` — full TanStack Query result
 *   with `data` renamed to `encryptedAsset`
 */
export function useEncryptedAsset(params: UseEncryptedAssetParams) {
  const { address } = params;

  const { data, ...rest } = useQuery({
    queryKey: encryptedAssetKeys.detail(address),
    queryFn: () => getEncryptedAsset(address),
    enabled: Boolean(address),
  });

  return { encryptedAsset: data ?? null, ...rest };
}

/**
 * Fetch a paginated list of LSP29 Encrypted Assets via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useEncryptedAssets`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter, sort, and pagination config
 * @returns `{ encryptedAssets, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `encryptedAssets` and `totalCount`
 */
export function useEncryptedAssets(params: UseEncryptedAssetsParams = {}) {
  const { filter, sort, limit, offset } = params;

  const { data, ...rest } = useQuery({
    queryKey: encryptedAssetKeys.list(filter, sort, limit, offset),
    queryFn: () => getEncryptedAssets({ filter, sort, limit, offset }),
  });

  return {
    encryptedAssets: data?.encryptedAssets ?? [],
    totalCount: data?.totalCount ?? 0,
    ...rest,
  };
}

/**
 * Fetch LSP29 Encrypted Assets with infinite scroll pagination via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useInfiniteEncryptedAssets`, but routes the
 * request through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter, sort, and pageSize config
 * @returns `{ encryptedAssets, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened encrypted assets array with infinite scroll controls
 */
export function useInfiniteEncryptedAssets(params: UseInfiniteEncryptedAssetsParams = {}) {
  const { filter, sort, pageSize = DEFAULT_PAGE_SIZE } = params;

  const result = useInfiniteQuery({
    queryKey: encryptedAssetKeys.infinite(filter, sort),
    queryFn: ({ pageParam }) =>
      getEncryptedAssets({
        filter,
        sort,
        limit: pageSize,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.encryptedAssets.length < pageSize) {
        return undefined;
      }
      return lastPageParam + pageSize;
    },
  });

  // Destructure infinite query properties before rest spread to avoid TS2783
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest } = result;
  const encryptedAssets = useMemo(
    () => data?.pages.flatMap((page) => page.encryptedAssets) ?? [],
    [data?.pages],
  );

  return {
    encryptedAssets,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    ...rest,
  };
}
