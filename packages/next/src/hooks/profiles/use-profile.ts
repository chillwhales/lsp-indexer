'use client';

import { createUseProfile } from '@lsp-indexer/react';
import { getProfile } from '../../actions/profiles';

/**
 * Fetch a single Universal Profile by address via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useProfile`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 * This keeps the GraphQL endpoint hidden from the client.
 *
 * @param params - Profile address and optional include config
 * @returns `{ profile, isLoading, error, ...rest }` — full TanStack Query result
 *   with `data` renamed to `profile`
 *
 * @example
 * ```tsx
 * import { useProfile } from '@lsp-indexer/next';
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
export const useProfile = createUseProfile(getProfile);
