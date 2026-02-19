import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { encryptedFeedKeys, fetchEncryptedAssetFeed, getClientUrl } from '@lsp-indexer/node';
import type {
  UseEncryptedAssetFeedParams,
  UseInfiniteEncryptedAssetFeedParams,
} from '@lsp-indexer/types';

/** Default number of feed entries per page for infinite scroll queries */
const DEFAULT_PAGE_SIZE = 20;

/**
 * Fetch a paginated list of LSP29 Encrypted Asset Feed Entries with filtering and sorting.
 *
 * Wraps `fetchEncryptedAssetFeed` in a TanStack `useQuery` hook. Supports filtering
 * by asset address and universal profile ID, plus sorting by timestamp, array index,
 * or address.
 *
 * @param params - Optional filter, sort, and pagination config
 * @returns `{ entries, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `entries` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useEncryptedAssetFeed } from '@lsp-indexer/react';
 *
 * function FeedList({ assetAddress }: { assetAddress: string }) {
 *   const { entries, totalCount, isLoading } = useEncryptedAssetFeed({
 *     filter: { address: assetAddress },
 *     sort: { field: 'timestamp', direction: 'desc' },
 *     limit: 20,
 *   });
 *
 *   return (
 *     <div>
 *       <p>{totalCount} feed entries found</p>
 *       {entries.map((e) => (
 *         <div key={e.id}>{e.contentIdHash}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useEncryptedAssetFeed(params: UseEncryptedAssetFeedParams = {}) {
  const url = getClientUrl();
  const { filter, sort, limit, offset } = params;

  const { data, ...rest } = useQuery({
    queryKey: encryptedFeedKeys.list(filter, sort, limit, offset),
    queryFn: () => fetchEncryptedAssetFeed(url, { filter, sort, limit, offset }),
  });

  return {
    entries: data?.entries ?? [],
    totalCount: data?.totalCount ?? 0,
    ...rest,
  };
}

/**
 * Fetch LSP29 Encrypted Asset Feed Entries with infinite scroll pagination.
 *
 * Wraps `fetchEncryptedAssetFeed` in a TanStack `useInfiniteQuery` hook with offset-based
 * pagination. Pages are automatically flattened into a single `entries` array.
 * Uses a **separate query key namespace** from `useEncryptedAssetFeed` to prevent cache
 * corruption between standard and infinite query data structures.
 *
 * @param params - Optional filter, sort, and pageSize config
 * @returns `{ entries, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened entries array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteEncryptedAssetFeed } from '@lsp-indexer/react';
 *
 * function InfiniteFeedList() {
 *   const {
 *     entries,
 *     hasNextPage,
 *     fetchNextPage,
 *     isFetchingNextPage,
 *     isLoading,
 *   } = useInfiniteEncryptedAssetFeed({
 *     filter: { address: '0x...' },
 *     sort: { field: 'timestamp', direction: 'desc' },
 *     pageSize: 20,
 *   });
 *
 *   return (
 *     <div>
 *       {entries.map((e) => (
 *         <div key={e.id}>{e.contentIdHash}</div>
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
export function useInfiniteEncryptedAssetFeed(params: UseInfiniteEncryptedAssetFeedParams = {}) {
  const url = getClientUrl();
  const { filter, sort, pageSize = DEFAULT_PAGE_SIZE } = params;

  const result = useInfiniteQuery({
    queryKey: encryptedFeedKeys.infinite(filter, sort),
    queryFn: ({ pageParam }) =>
      fetchEncryptedAssetFeed(url, {
        filter,
        sort,
        limit: pageSize,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      // If the last page returned fewer results than requested, there are no more pages
      if (lastPage.entries.length < pageSize) {
        return undefined;
      }
      // Next offset = current offset + page size
      return lastPageParam + pageSize;
    },
  });

  // Flatten all pages into a single entries array (memoized to avoid re-flattening on every render)
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest } = result;
  const entries = useMemo(() => data?.pages.flatMap((page) => page.entries) ?? [], [data?.pages]);

  return {
    entries,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    ...rest,
  };
}
