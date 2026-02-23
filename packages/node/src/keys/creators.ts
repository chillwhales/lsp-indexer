import type { CreatorFilter, CreatorInclude, CreatorSort } from '@lsp-indexer/types';

/**
 * Query key factory for Creator domain.
 *
 * Follows the TkDodo hierarchical key pattern for granular cache invalidation.
 * Keys are structured so that invalidating a parent key automatically
 * invalidates all child keys.
 *
 * **Hierarchy:**
 * ```
 * creatorKeys.all                          → ['creators']
 * creatorKeys.lists()                      → ['creators', 'list']
 * creatorKeys.list(...)                    → ['creators', 'list', ...]
 * creatorKeys.infinites()                  → ['creators', 'infinite']
 * creatorKeys.infinite(...)                → ['creators', 'infinite', ...]
 * ```
 *
 * **IMPORTANT:** `list` and `infinite` use separate namespaces to prevent
 * TanStack Query cache corruption between useQuery and useInfiniteQuery.
 *
 * Only 2 hooks: `useCreators` (paginated list) and `useInfiniteCreators`
 * (infinite scroll). No singular `useCreator` — no natural key exists.
 *
 * **Cache invalidation examples:**
 * ```ts
 * // Invalidate ALL creator queries (list + infinite)
 * queryClient.invalidateQueries({ queryKey: creatorKeys.all });
 *
 * // Invalidate all paginated list queries
 * queryClient.invalidateQueries({ queryKey: creatorKeys.lists() });
 *
 * // Invalidate all infinite scroll queries
 * queryClient.invalidateQueries({ queryKey: creatorKeys.infinites() });
 * ```
 */
export const creatorKeys = {
  /** Base key for all creator queries — invalidate this to clear the entire creator cache */
  all: ['creators'] as const,

  /** Parent key for all paginated list queries */
  lists: () => [...creatorKeys.all, 'list'] as const,

  /** Key for a specific paginated creator list query */
  list: (
    filter?: CreatorFilter,
    sort?: CreatorSort,
    limit?: number,
    offset?: number,
    include?: CreatorInclude,
  ) => [...creatorKeys.lists(), filter, sort, limit, offset, include] as const,

  /** Parent key for all infinite scroll queries */
  infinites: () => [...creatorKeys.all, 'infinite'] as const,

  /** Key for a specific infinite scroll creator query */
  infinite: (filter?: CreatorFilter, sort?: CreatorSort, include?: CreatorInclude) =>
    [...creatorKeys.infinites(), filter, sort, include] as const,
} as const;
