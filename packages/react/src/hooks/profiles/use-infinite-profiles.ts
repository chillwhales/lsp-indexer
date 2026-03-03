import { fetchProfiles, getClientUrl } from '@lsp-indexer/node';
import { createUseInfiniteProfiles } from '../factories';

/**
 * Fetch Universal Profiles with infinite scroll pagination.
 *
 * Wraps `fetchProfiles` in a TanStack `useInfiniteQuery` hook with offset-based
 * pagination. Pages are automatically flattened into a single `profiles` array.
 * Uses a **separate query key namespace** from `useProfiles` to prevent cache
 * corruption between standard and infinite query data structures.
 *
 * @param params - Optional filter, sort, pageSize, and include config
 * @returns `{ profiles, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened profiles array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteProfiles } from '@lsp-indexer/react';
 *
 * function InfiniteProfileList() {
 *   const {
 *     profiles,
 *     hasNextPage,
 *     fetchNextPage,
 *     isFetchingNextPage,
 *     isLoading,
 *   } = useInfiniteProfiles({
 *     filter: { followedBy: '0x1234...' },
 *     sort: { field: 'name', direction: 'asc' },
 *     pageSize: 20,
 *   });
 *
 *   return (
 *     <div>
 *       {profiles.map((p) => (
 *         <div key={p.address}>{p.name}</div>
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
export const useInfiniteProfiles = createUseInfiniteProfiles((params) =>
  fetchProfiles(getClientUrl(), params),
);
