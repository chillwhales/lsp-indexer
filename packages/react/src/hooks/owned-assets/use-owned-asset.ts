import { fetchOwnedAsset, getClientUrl } from '@lsp-indexer/node';
import { createUseOwnedAsset } from '../factories';

/**
 * Fetch a single owned asset by unique ID.
 *
 * Wraps `fetchOwnedAsset` in a TanStack `useQuery` hook with automatic caching,
 * deduplication, and stale-while-revalidate. The query is disabled when
 * `id` is falsy (empty string, undefined via type widening, etc.).
 *
 * @param params - Owned asset ID and optional include config
 * @returns `{ ownedAsset, isLoading, error, ...rest }` — full TanStack Query result
 *   with `data` renamed to `ownedAsset`
 *
 * @example
 * ```tsx
 * import { useOwnedAsset } from '@lsp-indexer/react';
 *
 * function OwnedAssetCard({ id }: { id: string }) {
 *   const { ownedAsset, isLoading, error } = useOwnedAsset({ id });
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <Alert>{error.message}</Alert>;
 *   if (!ownedAsset) return <p>Owned asset not found</p>;
 *
 *   return (
 *     <div>
 *       <h2>{ownedAsset.address}</h2>
 *       <p>Balance: {ownedAsset.balance.toString()}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export const useOwnedAsset = createUseOwnedAsset((params) =>
  fetchOwnedAsset(getClientUrl(), params),
);
