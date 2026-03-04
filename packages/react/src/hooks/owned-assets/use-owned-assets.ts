import { fetchOwnedAssets, getClientUrl } from '@lsp-indexer/node';
import { createUseOwnedAssets } from '../factories';

/**
 * Fetch a paginated list of owned assets with filtering and sorting.
 *
 * Wraps `fetchOwnedAssets` in a TanStack `useQuery` hook. Supports filtering
 * (by holderAddress, digitalAssetAddress, holderName, assetName) and sorting
 * (by balance, timestamp, digitalAssetAddress, holderAddress, block, digitalAssetName, tokenIdCount).
 *
 * @param params - Optional filter, sort, pagination, and include config
 * @returns `{ ownedAssets, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `ownedAssets` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useOwnedAssets } from '@lsp-indexer/react';
 *
 * function OwnedAssetList({ owner }: { owner: string }) {
 *   const { ownedAssets, totalCount, isLoading } = useOwnedAssets({
 *     filter: { owner },
 *     sort: { field: 'balance', direction: 'desc' },
 *     limit: 20,
 *     offset: 0,
 *   });
 *
 *   return (
 *     <div>
 *       <p>{totalCount} owned assets found</p>
 *       {ownedAssets.map((a) => (
 *         <div key={a.id}>{a.address} — {a.balance.toString()}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export const useOwnedAssets = createUseOwnedAssets((params) =>
  fetchOwnedAssets(getClientUrl(), params),
);
