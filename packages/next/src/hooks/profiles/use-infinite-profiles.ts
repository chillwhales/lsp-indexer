'use client';

import { createUseInfiniteProfiles } from '@lsp-indexer/react';
import { getProfiles } from '../../actions/profiles';

/**
 * Fetch Universal Profiles with infinite scroll pagination via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useInfiniteProfiles`, but routes the
 * request through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter, sort, pageSize, and include config
 * @returns `{ profiles, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened profiles array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteProfiles } from '@lsp-indexer/next';
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
export const useInfiniteProfiles = createUseInfiniteProfiles((params) => getProfiles(params));
