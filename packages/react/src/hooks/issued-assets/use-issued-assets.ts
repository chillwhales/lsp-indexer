import { fetchIssuedAssets, getClientUrl } from '@lsp-indexer/node';
import { createUseIssuedAssets } from '../factories';

/**
 * Fetch a paginated list of LSP12 issued asset records with filtering and sorting.
 *
 * Wraps `fetchIssuedAssets` in a TanStack `useQuery` hook. Supports comprehensive
 * filtering (by issuerAddress, assetAddress, interfaceId, issuerName,
 * digitalAssetName, timestampFrom, timestampTo) and sorting (by timestamp,
 * issuerAddress, assetAddress, arrayIndex, issuerName, digitalAssetName).
 *
 * @param params - Optional filter, sort, pagination, and include config
 * @returns `{ issuedAssets, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `issuedAssets` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useIssuedAssets } from '@lsp-indexer/react';
 *
 * function IssuedAssetList({ address }: { address: string }) {
 *   const { issuedAssets, totalCount, isLoading } = useIssuedAssets({
 *     filter: { issuerAddress: address },
 *     sort: { field: 'timestamp', direction: 'desc' },
 *     limit: 20,
 *   });
 *
 *   return (
 *     <div>
 *       <p>{totalCount} issued assets</p>
 *       {issuedAssets.map((ia) => (
 *         <div key={`${ia.issuerAddress}-${ia.assetAddress}`}>
 *           {ia.assetAddress}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export const useIssuedAssets = createUseIssuedAssets((params) =>
  fetchIssuedAssets(getClientUrl(), params),
);
