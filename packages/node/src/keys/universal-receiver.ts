import type { UniversalReceiverFilter, UniversalReceiverSort } from '@lsp-indexer/types';

/**
 * Query key factory for Universal Receiver event queries.
 *
 * Follows the TkDodo hierarchical key pattern for granular cache invalidation.
 * Keys are structured so that invalidating a parent key automatically
 * invalidates all child keys.
 *
 * **Hierarchy:**
 * ```
 * universalReceiverKeys.all              → ['universal-receiver']
 * universalReceiverKeys.lists()          → ['universal-receiver', 'list']
 * universalReceiverKeys.list(f,s,l,o)    → ['universal-receiver', 'list', { filter, sort, limit, offset }]
 * universalReceiverKeys.infinites()      → ['universal-receiver', 'infinite']
 * universalReceiverKeys.infinite(f, s)   → ['universal-receiver', 'infinite', { filter, sort }]
 * ```
 *
 * **Why `list` and `infinite` are separate:**
 * `useQuery` and `useInfiniteQuery` store fundamentally different data structures
 * in the TanStack Query cache (single result vs. pages array). Sharing keys
 * between them causes cache corruption and runtime errors.
 *
 * **Cache invalidation examples:**
 * ```ts
 * // Invalidate ALL universal receiver queries (list + infinite)
 * queryClient.invalidateQueries({ queryKey: universalReceiverKeys.all });
 *
 * // Invalidate all list queries (any filter/sort combination)
 * queryClient.invalidateQueries({ queryKey: universalReceiverKeys.lists() });
 *
 * // Invalidate all infinite scroll queries
 * queryClient.invalidateQueries({ queryKey: universalReceiverKeys.infinites() });
 * ```
 */
export const universalReceiverKeys = {
  /** Base key for all universal receiver queries — invalidate this to clear the entire cache */
  all: ['universal-receiver'] as const,

  /** Parent key for all paginated list queries (used with `useQuery`) */
  lists: () => [...universalReceiverKeys.all, 'list'] as const,

  /** Key for a specific list query with filter, sort, pagination params */
  list: (
    filter?: UniversalReceiverFilter,
    sort?: UniversalReceiverSort,
    limit?: number,
    offset?: number,
  ) => [...universalReceiverKeys.lists(), { filter, sort, limit, offset }] as const,

  /** Parent key for all infinite scroll queries (used with `useInfiniteQuery`) */
  infinites: () => [...universalReceiverKeys.all, 'infinite'] as const,

  /** Key for a specific infinite scroll query with filter and sort params */
  infinite: (filter?: UniversalReceiverFilter, sort?: UniversalReceiverSort) =>
    [...universalReceiverKeys.infinites(), { filter, sort }] as const,
} as const;
