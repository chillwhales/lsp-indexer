import type { CreatorFilter, CreatorSort } from '@lsp-indexer/types';

/**
 * Query key factory for Creator Addresses queries.
 *
 * Follows the TkDodo hierarchical key pattern for granular cache invalidation.
 * Keys are structured so that invalidating a parent key automatically
 * invalidates all child keys.
 *
 * **Hierarchy:**
 * ```
 * creatorKeys.all                → ['creators']
 * creatorKeys.lists()            → ['creators', 'list']
 * creatorKeys.list(f,s,l,o)      → ['creators', 'list', { filter, sort, limit, offset }]
 * creatorKeys.infinites()        → ['creators', 'infinite']
 * creatorKeys.infinite(f, s)     → ['creators', 'infinite', { filter, sort }]
 * ```
 *
 * **Why `list` and `infinite` are separate:**
 * `useQuery` and `useInfiniteQuery` store fundamentally different data structures
 * in the TanStack Query cache (single result vs. pages array). Sharing keys
 * between them causes cache corruption and runtime errors.
 *
 * **Cache invalidation examples:**
 * ```ts
 * // Invalidate ALL creator queries (list + infinite)
 * queryClient.invalidateQueries({ queryKey: creatorKeys.all });
 *
 * // Invalidate all list queries (any filter/sort combination)
 * queryClient.invalidateQueries({ queryKey: creatorKeys.lists() });
 *
 * // Invalidate all infinite scroll queries
 * queryClient.invalidateQueries({ queryKey: creatorKeys.infinites() });
 * ```
 */
export const creatorKeys = {
  /** Base key for all creator queries — invalidate this to clear the entire creator cache */
  all: ['creators'] as const,

  /** Parent key for all paginated list queries (used with `useQuery`) */
  lists: () => [...creatorKeys.all, 'list'] as const,

  /** Key for a specific list query with filter, sort, and pagination params */
  list: (filter?: CreatorFilter, sort?: CreatorSort, limit?: number, offset?: number) =>
    [...creatorKeys.lists(), { filter, sort, limit, offset }] as const,

  /** Parent key for all infinite scroll queries (used with `useInfiniteQuery`) */
  infinites: () => [...creatorKeys.all, 'infinite'] as const,

  /** Key for a specific infinite scroll query with filter and sort params */
  infinite: (filter?: CreatorFilter, sort?: CreatorSort) =>
    [...creatorKeys.infinites(), { filter, sort }] as const,
} as const;
