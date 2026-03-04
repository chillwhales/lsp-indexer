import { fetchProfiles, getClientUrl } from '@lsp-indexer/node';
import { createUseProfiles } from '../factories';

/**
 * Fetch a paginated list of Universal Profiles with filtering and sorting.
 *
 * Wraps `fetchProfiles` in a TanStack `useQuery` hook. Supports comprehensive
 * filtering (by name, follow relationships, token ownership) and sorting
 * (by name, follower count, following count).
 *
 * @param params - Optional filter, sort, pagination, and include config
 * @returns `{ profiles, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `profiles` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useProfiles } from '@lsp-indexer/react';
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
export const useProfiles = createUseProfiles((params) => fetchProfiles(getClientUrl(), params));
