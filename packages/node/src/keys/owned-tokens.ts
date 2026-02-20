import type { OwnedTokenFilter, OwnedTokenInclude, OwnedTokenSort } from '@lsp-indexer/types';

/**
 * Query key factory for Owned Token domain (LSP8 individual NFT ownership).
 *
 * Follows the TkDodo hierarchical key pattern for granular cache invalidation.
 * Keys are structured so that invalidating a parent key automatically
 * invalidates all child keys.
 *
 * **Hierarchy:**
 * ```
 * ownedTokenKeys.all                       → ['owned-tokens']
 * ownedTokenKeys.details()                 → ['owned-tokens', 'detail']
 * ownedTokenKeys.detail(id, include?)      → ['owned-tokens', 'detail', { id, include }]
 * ownedTokenKeys.lists()                   → ['owned-tokens', 'list']
 * ownedTokenKeys.list(f, s, l, o, i)      → ['owned-tokens', 'list', { filter, sort, limit, offset, include }]
 * ownedTokenKeys.infinites()               → ['owned-tokens', 'infinite']
 * ownedTokenKeys.infinite(f, s, i)         → ['owned-tokens', 'infinite', { filter, sort, include }]
 * ```
 *
 * **IMPORTANT:** `list` and `infinite` use separate namespaces to prevent
 * TanStack Query cache corruption between useQuery and useInfiniteQuery.
 *
 * **Cache invalidation examples:**
 * ```ts
 * // Invalidate ALL owned token queries (detail + list + infinite)
 * queryClient.invalidateQueries({ queryKey: ownedTokenKeys.all });
 *
 * // Invalidate all list queries
 * queryClient.invalidateQueries({ queryKey: ownedTokenKeys.lists() });
 *
 * // Invalidate all infinite scroll queries
 * queryClient.invalidateQueries({ queryKey: ownedTokenKeys.infinites() });
 * ```
 */
export const ownedTokenKeys = {
  /** Base key for all owned token queries — invalidate this to clear the entire owned token cache */
  all: ['owned-tokens'] as const,

  /** Parent key for all single-token detail queries */
  details: () => [...ownedTokenKeys.all, 'detail'] as const,

  /** Key for a specific owned token by ID and include config */
  detail: (id: string, include?: OwnedTokenInclude) =>
    [...ownedTokenKeys.details(), { id, include }] as const,

  /** Parent key for all paginated list queries (used with `useQuery`) */
  lists: () => [...ownedTokenKeys.all, 'list'] as const,

  /** Key for a specific list query with filter, sort, pagination, and include params */
  list: (
    filter?: OwnedTokenFilter,
    sort?: OwnedTokenSort,
    limit?: number,
    offset?: number,
    include?: OwnedTokenInclude,
  ) => [...ownedTokenKeys.lists(), { filter, sort, limit, offset, include }] as const,

  /** Parent key for all infinite scroll queries (used with `useInfiniteQuery`) */
  infinites: () => [...ownedTokenKeys.all, 'infinite'] as const,

  /** Key for a specific infinite scroll query with filter, sort, and include params */
  infinite: (filter?: OwnedTokenFilter, sort?: OwnedTokenSort, include?: OwnedTokenInclude) =>
    [...ownedTokenKeys.infinites(), { filter, sort, include }] as const,
} as const;
