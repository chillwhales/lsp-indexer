import type {
  OwnedAssetFilter,
  OwnedAssetSort,
  OwnedTokenFilter,
  OwnedTokenSort,
} from '@lsp-indexer/types';

/**
 * Query key factory for Owned Asset (LSP7 fungible token) queries.
 *
 * Follows the TkDodo hierarchical key pattern for granular cache invalidation.
 * Keys are structured so that invalidating a parent key automatically
 * invalidates all child keys.
 *
 * **Hierarchy:**
 * ```
 * ownedAssetKeys.all              → ['owned-assets']
 * ownedAssetKeys.assets()         → ['owned-assets', 'assets']
 * ownedAssetKeys.lists()          → ['owned-assets', 'assets', 'list']
 * ownedAssetKeys.list(f,s,l,o)    → ['owned-assets', 'assets', 'list', { filter, sort, limit, offset }]
 * ownedAssetKeys.infinites()      → ['owned-assets', 'assets', 'infinite']
 * ownedAssetKeys.infinite(f, s)   → ['owned-assets', 'assets', 'infinite', { filter, sort }]
 * ```
 *
 * **Cache invalidation examples:**
 * ```ts
 * // Invalidate ALL owned asset queries (list + infinite)
 * queryClient.invalidateQueries({ queryKey: ownedAssetKeys.all });
 *
 * // Invalidate all list queries (any filter/sort combination)
 * queryClient.invalidateQueries({ queryKey: ownedAssetKeys.lists() });
 *
 * // Invalidate all infinite scroll queries
 * queryClient.invalidateQueries({ queryKey: ownedAssetKeys.infinites() });
 * ```
 */
export const ownedAssetKeys = {
  /** Base key for all owned asset queries — invalidate this to clear the entire cache */
  all: ['owned-assets'] as const,

  /** Namespace for LSP7 fungible asset queries */
  assets: () => [...ownedAssetKeys.all, 'assets'] as const,

  /** Parent key for all paginated list queries (used with `useQuery`) */
  lists: () => [...ownedAssetKeys.assets(), 'list'] as const,

  /** Key for a specific list query with filter, sort, and pagination params */
  list: (filter?: OwnedAssetFilter, sort?: OwnedAssetSort, limit?: number, offset?: number) =>
    [...ownedAssetKeys.lists(), { filter, sort, limit, offset }] as const,

  /** Parent key for all infinite scroll queries (used with `useInfiniteQuery`) */
  infinites: () => [...ownedAssetKeys.assets(), 'infinite'] as const,

  /** Key for a specific infinite scroll query with filter and sort params */
  infinite: (filter?: OwnedAssetFilter, sort?: OwnedAssetSort) =>
    [...ownedAssetKeys.infinites(), { filter, sort }] as const,
} as const;

/**
 * Query key factory for Owned Token (LSP8 NFT) queries.
 *
 * Follows the TkDodo hierarchical key pattern for granular cache invalidation.
 * Keys are structured so that invalidating a parent key automatically
 * invalidates all child keys.
 *
 * **Hierarchy:**
 * ```
 * ownedTokenKeys.all              → ['owned-tokens']
 * ownedTokenKeys.tokens()         → ['owned-tokens', 'tokens']
 * ownedTokenKeys.lists()          → ['owned-tokens', 'tokens', 'list']
 * ownedTokenKeys.list(f,s,l,o)    → ['owned-tokens', 'tokens', 'list', { filter, sort, limit, offset }]
 * ownedTokenKeys.infinites()      → ['owned-tokens', 'tokens', 'infinite']
 * ownedTokenKeys.infinite(f, s)   → ['owned-tokens', 'tokens', 'infinite', { filter, sort }]
 * ```
 *
 * **Cache invalidation examples:**
 * ```ts
 * // Invalidate ALL owned token queries (list + infinite)
 * queryClient.invalidateQueries({ queryKey: ownedTokenKeys.all });
 *
 * // Invalidate all list queries (any filter/sort combination)
 * queryClient.invalidateQueries({ queryKey: ownedTokenKeys.lists() });
 *
 * // Invalidate all infinite scroll queries
 * queryClient.invalidateQueries({ queryKey: ownedTokenKeys.infinites() });
 * ```
 */
export const ownedTokenKeys = {
  /** Base key for all owned token queries — invalidate this to clear the entire cache */
  all: ['owned-tokens'] as const,

  /** Namespace for LSP8 NFT queries */
  tokens: () => [...ownedTokenKeys.all, 'tokens'] as const,

  /** Parent key for all paginated list queries (used with `useQuery`) */
  lists: () => [...ownedTokenKeys.tokens(), 'list'] as const,

  /** Key for a specific list query with filter, sort, and pagination params */
  list: (filter?: OwnedTokenFilter, sort?: OwnedTokenSort, limit?: number, offset?: number) =>
    [...ownedTokenKeys.lists(), { filter, sort, limit, offset }] as const,

  /** Parent key for all infinite scroll queries (used with `useInfiniteQuery`) */
  infinites: () => [...ownedTokenKeys.tokens(), 'infinite'] as const,

  /** Key for a specific infinite scroll query with filter and sort params */
  infinite: (filter?: OwnedTokenFilter, sort?: OwnedTokenSort) =>
    [...ownedTokenKeys.infinites(), { filter, sort }] as const,
} as const;
