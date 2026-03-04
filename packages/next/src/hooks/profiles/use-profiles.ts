'use client';

import { createUseProfiles } from '@lsp-indexer/react';
import { getProfiles } from '../../actions/profiles';

/**
 * Fetch a paginated list of Universal Profiles via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useProfiles`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter, sort, pagination, and include config
 * @returns `{ profiles, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `profiles` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useProfiles } from '@lsp-indexer/next';
 *
 * function ProfileList() {
 *   const { profiles, totalCount, isLoading } = useProfiles({
 *     filter: { name: 'alice' },
 *     sort: { field: 'followerCount', direction: 'desc' },
 *     limit: 20,
 *     offset: 0,
 *   });
 *
 *   return (
 *     <div>
 *       <p>{totalCount} profiles found</p>
 *       {profiles.map((p) => (
 *         <div key={p.address}>{p.name}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export const useProfiles = createUseProfiles(getProfiles);
