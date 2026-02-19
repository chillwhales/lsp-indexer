import type { EncryptedFeedFilter, EncryptedFeedSort } from '@lsp-indexer/types';

/**
 * Query key factory for LSP29 Encrypted Asset Feed Entry queries.
 *
 * Follows the TkDodo hierarchical key pattern for granular cache invalidation.
 * Keys are structured so that invalidating a parent key automatically
 * invalidates all child keys.
 *
 * **Hierarchy:**
 * ```
 * encryptedFeedKeys.all              → ['encrypted-feed']
 * encryptedFeedKeys.lists()          → ['encrypted-feed', 'list']
 * encryptedFeedKeys.list(f,s,l,o)    → ['encrypted-feed', 'list', { filter, sort, limit, offset }]
 * encryptedFeedKeys.infinites()      → ['encrypted-feed', 'infinite']
 * encryptedFeedKeys.infinite(f, s)   → ['encrypted-feed', 'infinite', { filter, sort }]
 * ```
 *
 * **Why `list` and `infinite` are separate:**
 * `useQuery` and `useInfiniteQuery` store fundamentally different data structures
 * in the TanStack Query cache (single result vs. pages array). Sharing keys
 * between them causes cache corruption and runtime errors.
 */
export const encryptedFeedKeys = {
  /** Base key for all encrypted feed queries — invalidate this to clear the entire feed cache */
  all: ['encrypted-feed'] as const,

  /** Parent key for all paginated list queries (used with `useQuery`) */
  lists: () => [...encryptedFeedKeys.all, 'list'] as const,

  /** Key for a specific list query with filter, sort, and pagination params */
  list: (filter?: EncryptedFeedFilter, sort?: EncryptedFeedSort, limit?: number, offset?: number) =>
    [...encryptedFeedKeys.lists(), { filter, sort, limit, offset }] as const,

  /** Parent key for all infinite scroll queries (used with `useInfiniteQuery`) */
  infinites: () => [...encryptedFeedKeys.all, 'infinite'] as const,

  /** Key for a specific infinite scroll query with filter and sort params */
  infinite: (filter?: EncryptedFeedFilter, sort?: EncryptedFeedSort) =>
    [...encryptedFeedKeys.infinites(), { filter, sort }] as const,
} as const;
