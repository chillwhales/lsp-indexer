import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { encryptedFeedKeys } from '@lsp-indexer/node';
import type {
  UseEncryptedAssetFeedParams,
  UseInfiniteEncryptedAssetFeedParams,
} from '@lsp-indexer/types';

import { getEncryptedAssetFeed } from '../actions/encrypted-feed';

/** Default number of feed entries per page for infinite scroll queries */
const DEFAULT_PAGE_SIZE = 20;

/**
 * Fetch a paginated list of LSP29 Encrypted Asset Feed Entries via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useEncryptedAssetFeed`, but routes the
 * request through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter, sort, and pagination config
 * @returns `{ entries, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `entries` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useEncryptedAssetFeed } from '@lsp-indexer/next';
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
  const { filter, sort, limit, offset } = params;

  const { data, ...rest } = useQuery({
    queryKey: encryptedFeedKeys.list(filter, sort, limit, offset),
    queryFn: () => getEncryptedAssetFeed({ filter, sort, limit, offset }),
  });

  return {
    entries: data?.entries ?? [],
    totalCount: data?.totalCount ?? 0,
    ...rest,
  };
}

/**
 * Fetch LSP29 Encrypted Asset Feed Entries with infinite scroll pagination via
 * Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useInfiniteEncryptedAssetFeed`, but routes
 * the request through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter, sort, and pageSize config
 * @returns `{ entries, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened entries array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteEncryptedAssetFeed } from '@lsp-indexer/next';
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
  const { filter, sort, pageSize = DEFAULT_PAGE_SIZE } = params;

  const result = useInfiniteQuery({
    queryKey: encryptedFeedKeys.infinite(filter, sort),
    queryFn: ({ pageParam }) =>
      getEncryptedAssetFeed({
        filter,
        sort,
        limit: pageSize,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.entries.length < pageSize) {
        return undefined;
      }
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
