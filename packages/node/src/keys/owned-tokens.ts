import type { OwnedTokenFilter, OwnedTokenInclude, OwnedTokenSort } from '@lsp-indexer/types';

/**
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
 */
export const ownedTokenKeys = {
  all: ['owned-tokens'] as const,

  details: () => [...ownedTokenKeys.all, 'detail'] as const,

  detail: (id: string, include?: OwnedTokenInclude) =>
    [...ownedTokenKeys.details(), { id, include }] as const,

  lists: () => [...ownedTokenKeys.all, 'list'] as const,

  list: (
    filter?: OwnedTokenFilter,
    sort?: OwnedTokenSort,
    limit?: number,
    offset?: number,
    include?: OwnedTokenInclude,
  ) => [...ownedTokenKeys.lists(), { filter, sort, limit, offset, include }] as const,

  infinites: () => [...ownedTokenKeys.all, 'infinite'] as const,

  infinite: (filter?: OwnedTokenFilter, sort?: OwnedTokenSort, include?: OwnedTokenInclude) =>
    [...ownedTokenKeys.infinites(), { filter, sort, include }] as const,
} as const;
