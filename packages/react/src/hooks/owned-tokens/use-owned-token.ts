import { fetchOwnedToken, getClientUrl } from '@lsp-indexer/node';
import { createUseOwnedToken } from '../factories';

/**
 * Fetch a single owned token by unique ID.
 *
 * Wraps `fetchOwnedToken` in a TanStack `useQuery` hook with automatic caching,
 * deduplication, and stale-while-revalidate. The query is disabled when
 * `id` is falsy (empty string, undefined via type widening, etc.).
 *
 * @param params - Owned token ID and optional include config
 * @returns `{ ownedToken, isLoading, error, ...rest }` — full TanStack Query result
 *   with `data` renamed to `ownedToken`
 *
 * @example
 * ```tsx
 * import { useOwnedToken } from '@lsp-indexer/react';
 *
 * function OwnedTokenCard({ id }: { id: string }) {
 *   const { ownedToken, isLoading, error } = useOwnedToken({ id });
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <Alert>{error.message}</Alert>;
 *   if (!ownedToken) return <p>Owned token not found</p>;
 *
 *   return (
 *     <div>
 *       <h2>{ownedToken.digitalAssetAddress}</h2>
 *       <p>Token ID: {ownedToken.tokenId}</p>
 *       <p>Holder: {ownedToken.holderAddress}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export const useOwnedToken = createUseOwnedToken((params) =>
  fetchOwnedToken(getClientUrl(), params),
);
