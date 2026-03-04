import { fetchDigitalAssets, getClientUrl } from '@lsp-indexer/node';
import { createUseDigitalAssets } from '../factories';

/**
 * Fetch a paginated list of digital assets with filtering and sorting.
 *
 * Wraps `fetchDigitalAssets` in a TanStack `useQuery` hook. Supports comprehensive
 * filtering (by name, symbol, tokenType, category, holderAddress, ownerAddress) and
 * sorting (by name, symbol, holderCount, creatorCount, totalSupply, createdAt).
 *
 * @param params - Optional filter, sort, pagination, and include config
 * @returns `{ digitalAssets, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `digitalAssets` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useDigitalAssets } from '@lsp-indexer/react';
 *
 * function AssetList() {
 *   const { digitalAssets, totalCount, isLoading } = useDigitalAssets({
 *     filter: { tokenType: 'TOKEN' },
 *     sort: { field: 'name', direction: 'asc' },
 *     limit: 20,
 *     offset: 0,
 *   });
 *
 *   return (
 *     <div>
 *       <p>{totalCount} assets found</p>
 *       {digitalAssets.map((a) => (
 *         <div key={a.address}>{a.name}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export const useDigitalAssets = createUseDigitalAssets((params) =>
  fetchDigitalAssets(getClientUrl(), params),
);
