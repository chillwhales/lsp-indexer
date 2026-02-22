import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { digitalAssetKeys } from '@lsp-indexer/node';
import type {
  DigitalAssetInclude,
  DigitalAssetResult,
  UseDigitalAssetParams,
  UseDigitalAssetsParams,
  UseInfiniteDigitalAssetsParams,
} from '@lsp-indexer/types';

import { getDigitalAsset, getDigitalAssets } from '../actions/digital-assets';

/** Default number of digital assets per page for infinite scroll queries */
const DEFAULT_PAGE_SIZE = 20;

/**
 * Fetch a single digital asset by address via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useDigitalAsset`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 * This keeps the GraphQL endpoint hidden from the client.
 *
 * @param params - Digital asset address and optional include config
 * @returns `{ digitalAsset, isLoading, error, ...rest }` — full TanStack Query result
 *   with `data` renamed to `digitalAsset`
 *
 * @example
 * ```tsx
 * import { useDigitalAsset } from '@lsp-indexer/next';
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
export function useDigitalAsset<const I extends DigitalAssetInclude | undefined = undefined>(
  params: UseDigitalAssetParams & { include?: I },
) {
  const { address, include } = params;

  const { data, ...rest } = useQuery({
    queryKey: digitalAssetKeys.detail(address, include),
    queryFn: () => getDigitalAsset(address, include),
    enabled: Boolean(address),
  });

  return { digitalAsset: (data ?? null) as DigitalAssetResult<I> | null, ...rest };
}

/**
 * Fetch a paginated list of digital assets via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useDigitalAssets`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter, sort, pagination, and include config
 * @returns `{ digitalAssets, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `digitalAssets` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useDigitalAssets } from '@lsp-indexer/next';
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
export function useDigitalAssets<const I extends DigitalAssetInclude | undefined = undefined>(
  params: UseDigitalAssetsParams & { include?: I } = {} as UseDigitalAssetsParams & {
    include?: I;
  },
) {
  const { filter, sort, limit, offset, include } = params;

  const { data, ...rest } = useQuery({
    queryKey: digitalAssetKeys.list(filter, sort, limit, offset, include),
    queryFn: () => getDigitalAssets({ filter, sort, limit, offset, include }),
  });

  return {
    digitalAssets: (data?.digitalAssets ?? []) as DigitalAssetResult<I>[],
    totalCount: data?.totalCount ?? 0,
    ...rest,
  };
}

/**
 * Fetch digital assets with infinite scroll pagination via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useInfiniteDigitalAssets`, but routes the
 * request through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter, sort, pageSize, and include config
 * @returns `{ digitalAssets, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened digital assets array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteDigitalAssets } from '@lsp-indexer/next';
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
export function useInfiniteDigitalAssets<
  const I extends DigitalAssetInclude | undefined = undefined,
>(
  params: UseInfiniteDigitalAssetsParams & {
    include?: I;
  } = {} as UseInfiniteDigitalAssetsParams & {
    include?: I;
  },
) {
  const { filter, sort, pageSize = DEFAULT_PAGE_SIZE, include } = params;

  const result = useInfiniteQuery({
    queryKey: digitalAssetKeys.infinite(filter, sort, include),
    queryFn: ({ pageParam }) =>
      getDigitalAssets({
        filter,
        sort,
        limit: pageSize,
        offset: pageParam,
        include,
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
    () => (data?.pages.flatMap((page) => page.digitalAssets) ?? []) as DigitalAssetResult<I>[],
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
