import type {
  TokenIdDataChangedEventFilter,
  TokenIdDataChangedEventInclude,
  TokenIdDataChangedEventSort,
} from '@lsp-indexer/types';

/**
 * Query key factory for TokenIdDataChangedEvent domain.
 *
 * Follows the TkDodo hierarchical key pattern for granular cache invalidation.
 * Keys are structured so that invalidating a parent key automatically
 * invalidates all child keys.
 *
 * **Hierarchy:**
 * ```
 * tokenIdDataChangedEventKeys.all                   → ['tokenIdDataChangedEvents']
 * tokenIdDataChangedEventKeys.lists()               → ['tokenIdDataChangedEvents', 'list']
 * tokenIdDataChangedEventKeys.list(...)             → ['tokenIdDataChangedEvents', 'list', ...]
 * tokenIdDataChangedEventKeys.infinites()           → ['tokenIdDataChangedEvents', 'infinite']
 * tokenIdDataChangedEventKeys.infinite(...)         → ['tokenIdDataChangedEvents', 'infinite', ...]
 * ```
 *
 * **IMPORTANT:** `list` and `infinite` use separate namespaces to prevent
 * TanStack Query cache corruption between useQuery and useInfiniteQuery.
 *
 * Only 2 hooks: `useTokenIdDataChangedEvents` (paginated list) and
 * `useInfiniteTokenIdDataChangedEvents` (infinite scroll). No singular hook — no natural key.
 *
 * **Cache invalidation examples:**
 * ```ts
 * // Invalidate ALL token ID data changed event queries (list + infinite)
 * queryClient.invalidateQueries({ queryKey: tokenIdDataChangedEventKeys.all });
 *
 * // Invalidate all paginated list queries
 * queryClient.invalidateQueries({ queryKey: tokenIdDataChangedEventKeys.lists() });
 *
 * // Invalidate all infinite scroll queries
 * queryClient.invalidateQueries({ queryKey: tokenIdDataChangedEventKeys.infinites() });
 * ```
 */
export const tokenIdDataChangedEventKeys = {
  /** Base key for all token ID data changed event queries — invalidate this to clear the entire cache */
  all: ['tokenIdDataChangedEvents'] as const,

  /** Parent key for all paginated list queries */
  lists: () => [...tokenIdDataChangedEventKeys.all, 'list'] as const,

  /** Key for a specific paginated token ID data changed event list query */
  list: (
    filter?: TokenIdDataChangedEventFilter,
    sort?: TokenIdDataChangedEventSort,
    limit?: number,
    offset?: number,
    include?: TokenIdDataChangedEventInclude,
  ) => [...tokenIdDataChangedEventKeys.lists(), filter, sort, limit, offset, include] as const,

  /** Parent key for all infinite scroll queries */
  infinites: () => [...tokenIdDataChangedEventKeys.all, 'infinite'] as const,

  /** Key for a specific infinite scroll token ID data changed event query */
  infinite: (
    filter?: TokenIdDataChangedEventFilter,
    sort?: TokenIdDataChangedEventSort,
    include?: TokenIdDataChangedEventInclude,
  ) => [...tokenIdDataChangedEventKeys.infinites(), filter, sort, include] as const,
} as const;
