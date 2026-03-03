import { fetchProfile, getClientUrl } from '@lsp-indexer/node';
import { createUseProfile } from '../factories';

/**
 * Fetch a single Universal Profile by address.
 *
 * Wraps `fetchProfile` in a TanStack `useQuery` hook with automatic caching,
 * deduplication, and stale-while-revalidate. The query is disabled when
 * `address` is falsy (empty string, undefined via type widening, etc.).
 *
 * @param params - Profile address and optional include config
 * @returns `{ profile, isLoading, error, ...rest }` — full TanStack Query result
 *   with `data` renamed to `profile`
 *
 * @example
 * ```tsx
 * import { useProfile } from '@lsp-indexer/react';
 *
 * function ProfileCard({ address }: { address: string }) {
 *   const { profile, isLoading, error } = useProfile({ address });
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <Alert>{error.message}</Alert>;
 *   if (!profile) return <p>Profile not found</p>;
 *
 *   return (
 *     <div>
 *       <h2>{profile.name ?? 'Unnamed'}</h2>
 *       <p>{profile.followerCount} followers</p>
 *     </div>
 *   );
 * }
 * ```
 */
export const useProfile = createUseProfile((params) => fetchProfile(getClientUrl(), params));
