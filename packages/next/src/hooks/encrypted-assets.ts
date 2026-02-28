'use client';

import type { InfiniteData, UseInfiniteQueryResult, UseQueryResult } from '@tanstack/react-query';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { FetchEncryptedAssetsResult } from '@lsp-indexer/node';
import { encryptedAssetKeys } from '@lsp-indexer/node';
import type {
  EncryptedAsset,
  EncryptedAssetInclude,
  EncryptedAssetResult,
  PartialEncryptedAsset,
  UseEncryptedAssetsParams,
  UseInfiniteEncryptedAssetsParams,
} from '@lsp-indexer/types';

import { getEncryptedAssets } from '../actions/encrypted-assets';

/** Default number of encrypted assets per page for infinite scroll queries */
const DEFAULT_PAGE_SIZE = 20;

/** Flat return shape for useEncryptedAssets — encryptedAssets array + totalCount + query state */
type UseEncryptedAssetsReturn<F> = { encryptedAssets: F[]; totalCount: number } & Omit<
  UseQueryResult<FetchEncryptedAssetsResult<F>, Error>,
  'data'
>;

/** Flat return shape for useInfiniteEncryptedAssets — encryptedAssets array + infinite scroll controls + query state */
type UseInfiniteEncryptedAssetsReturn<F> = {
  encryptedAssets: F[];
  hasNextPage: boolean;
  fetchNextPage: UseInfiniteQueryResult['fetchNextPage'];
  isFetchingNextPage: boolean;
} & Omit<
  UseInfiniteQueryResult<InfiniteData<FetchEncryptedAssetsResult<F>>, Error>,
  'data' | 'hasNextPage' | 'fetchNextPage' | 'isFetchingNextPage'
>;

/**
 * Fetch a paginated list of LSP29 encrypted asset records via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useEncryptedAssets`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 * This keeps the GraphQL endpoint hidden from the client.
 *
 * @param params - Optional filter/sort/pagination/include
 * @returns `{ encryptedAssets, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `encryptedAssets` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useEncryptedAssets } from '@lsp-indexer/next';
 *
 * function EncryptedAssetList({ address }: { address: string }) {
 *   const { encryptedAssets, totalCount, isLoading } = useEncryptedAssets({
 *     filter: { address },
 *     sort: { field: 'timestamp', direction: 'desc' },
 *     limit: 20,
 *   });
 *
 *   return (
 *     <div>
 *       <p>{totalCount} encrypted assets</p>
 *       {encryptedAssets.map((ea) => (
 *         <div key={`${ea.address}-${ea.contentId}-${ea.revision}`}>
 *           {ea.address}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useEncryptedAssets<const I extends EncryptedAssetInclude>(
  params: UseEncryptedAssetsParams & { include: I },
): UseEncryptedAssetsReturn<EncryptedAssetResult<I>>;
export function useEncryptedAssets(
  params?: Omit<UseEncryptedAssetsParams, 'include'> & { include?: never },
): UseEncryptedAssetsReturn<EncryptedAsset>;
export function useEncryptedAssets(
  params: UseEncryptedAssetsParams & { include?: EncryptedAssetInclude },
): UseEncryptedAssetsReturn<PartialEncryptedAsset>;
export function useEncryptedAssets(
  params: UseEncryptedAssetsParams & { include?: EncryptedAssetInclude } = {},
): UseEncryptedAssetsReturn<PartialEncryptedAsset> {
  const { filter, sort, limit, offset, include } = params;

  const { data, ...rest } = useQuery({
    queryKey: encryptedAssetKeys.list(filter, sort, limit, offset, include),
    queryFn: () =>
      include
        ? getEncryptedAssets({ filter, sort, limit, offset, include })
        : getEncryptedAssets({ filter, sort, limit, offset }),
  });

  const encryptedAssets = data?.encryptedAssets ?? [];
  return { encryptedAssets, totalCount: data?.totalCount ?? 0, ...rest };
}

/**
 * Fetch LSP29 encrypted asset records with infinite scroll pagination via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useInfiniteEncryptedAssets`, but routes the
 * request through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter/sort/pageSize/include
 * @returns `{ encryptedAssets, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened encryptedAssets array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteEncryptedAssets } from '@lsp-indexer/next';
 *
 * function InfiniteEncryptedAssetList({ address }: { address: string }) {
 *   const {
 *     encryptedAssets,
 *     hasNextPage,
 *     fetchNextPage,
 *     isFetchingNextPage,
 *   } = useInfiniteEncryptedAssets({
 *     filter: { address },
 *   });
 *
 *   return (
 *     <div>
 *       {encryptedAssets.map((ea) => (
 *         <div key={`${ea.address}-${ea.contentId}-${ea.revision}`}>
 *           {ea.address}
 *         </div>
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
export function useInfiniteEncryptedAssets<const I extends EncryptedAssetInclude>(
  params: UseInfiniteEncryptedAssetsParams & { include: I },
): UseInfiniteEncryptedAssetsReturn<EncryptedAssetResult<I>>;
export function useInfiniteEncryptedAssets(
  params?: Omit<UseInfiniteEncryptedAssetsParams, 'include'> & { include?: never },
): UseInfiniteEncryptedAssetsReturn<EncryptedAsset>;
export function useInfiniteEncryptedAssets(
  params: UseInfiniteEncryptedAssetsParams & { include?: EncryptedAssetInclude },
): UseInfiniteEncryptedAssetsReturn<PartialEncryptedAsset>;
export function useInfiniteEncryptedAssets(
  params: UseInfiniteEncryptedAssetsParams & { include?: EncryptedAssetInclude } = {},
): UseInfiniteEncryptedAssetsReturn<PartialEncryptedAsset> {
  const { filter, sort, pageSize = DEFAULT_PAGE_SIZE, include } = params;

  const result = useInfiniteQuery({
    queryKey: encryptedAssetKeys.infinite(filter, sort, include),
    queryFn: ({ pageParam }) =>
      include
        ? getEncryptedAssets({
            filter,
            sort,
            limit: pageSize,
            offset: pageParam,
            include,
          })
        : getEncryptedAssets({
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

  // Flatten all pages into a single encryptedAssets array (memoized to avoid re-flattening on every render)
  // Destructure infinite query properties before rest spread to avoid TS2783 duplicate property errors
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
